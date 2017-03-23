var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser  = require('body-parser');

var graph = require('fbgraph');
var Promise = require("bluebird");
Promise.promisifyAll(graph);
var generator = require('generate-password');
var request = require('request');

var expressa = require('expressa');
var email = require('./email.js')
var pg = require('pg')

function populateUserFromFacebook(doc) {
  graph.setAccessToken(doc.fbAccessToken);
  return graph.getAsync('/me?fields=email,first_name,last_name,gender,timezone,location,birthday')
    .then(function(res) {
      if (res) {
        doc.email = res.email;
        doc.first_name = res.first_name;
        doc.last_name = res.last_name;
        doc.gender = res.gender;
        doc.password = generator.generate({
            length: 20,
            numbers: true
        });
        doc.facebook_id = res.id;
        var loc_parts = res.location.name.split(',');
        doc.address = {}
        doc.address.city = loc_parts[0];
        if (loc_parts.length >= 2) {
          doc.address.state = loc_parts[1];
        }
        doc.date_of_birth = new Date(res.birthday).toISOString();
        delete doc.fbAccessToken;
      }
      email.sendWelcomeEmail(doc);
    })
}

expressa.addListener('post', -10, function(req, collection, doc) {
  if (collection == 'users') {
    if (doc.fbAccessToken) {
      return populateUserFromFacebook(doc);
    } else {
      email.sendWelcomeEmail(doc);
    }
  }
  /*if (collection == 'users') {
    if (doc.transaction_id) {
      var payment;
      return new Promise(function(resolve, reject) {
        expressa.db.user_payments.find({'transaction_id': doc.transaction_id})
          .then(function(results) {
            if (results.length > 0) {
              payment = results[0];
              doc.payment_id = payment._id;
              doc.roles = doc.roles || [];
              doc.roles.push('ActivePass');
              doc.passType = results[0]['sku'];

              if (doc.fbAccessToken) {
                return populateUserFromFacebook(doc);
              } else {
                email.sendWelcomeEmail(doc);
                return doc;
              }
            }
          })
          .then(function(doc) {
              payment.linked_user = doc.email;
              expressa.db.user_payments.update(payment._id, payment);
              resolve();
          }, reject)
      });
    }
  }*/
  if (collection == 'race_signup') {
    return expressa.db.race_signup.find({ 'meta.owner' : req.user._id, 'status' : { '$in': ['pending', 'registered'] } })
      .then(function(race_signups) {
        var passRaceCount = {
          '3races': 3,
          '5races': 5,
          'unlimited': 200,
        }

        var current_count = race_signups.length;
        var plan_count = passRaceCount[req.user.passType] || 0;
        console.log('using ' + current_count + ' of ' + plan_count);
        if (plan_count == 0) {
          return {
            code: '400',
            message: 'You need to purchase a pass to register for races.',
          }
        }
        if (current_count >= plan_count) {
          return {
            code: '400',
            message: 'Already signed up for maximum number of races your plan provides',
          }
        }
        var race_ids = race_signups.map(function(signup) { return signup.race_id; });
        if (race_ids.indexOf(doc.race_id) != -1) {
          return {
            code: '400',
            message: 'You are already signed up for this race.',
          }
        }

      }, function(err) {
        console.error(err);
        console.error('failed to lookup user race count.')
      });
  }
})

expressa.addListener('put', -10, function(req, collection, doc) {
  if (collection == 'users' && doc.address && doc.address.city) {
    var key = 'AIzaSyDOZ8hCqFBA-vK2S5rt2eOJm_6FS36N2fE';
    var loc = doc.address.line1 + ',' + doc.address.city + ',' + doc.address.state + ',' + doc.address.zip;
    delete doc.race_signup_ids;
    delete doc.race_listings;
    return new Promise(function(resolve, reject) {
      request('https://maps.googleapis.com/maps/api/geocode/json?address='+loc+'&key='+key, function(err, response, body) {
                if (err) {
                  console.error(err);
                  console.error('failed to geolocate user\'s address');
                }
                var data = JSON.parse(body);
                if (!data.results[0]) {
                  return console.error('failed to geolocate user\'s address due to empty response.');
                }
                var latlng = data.results[0].geometry.location;
                doc.address.coordinates = latlng;
                resolve();
              });
    });
  }
  if (collection == 'race_signup') {
    return expressa.db.race_signup.get(doc._id)
      .then(function(old) {
        if (doc.status == 'cancelled' && old.status == 'registered') {
          doc.status = 'request_cancel';
          console.log('requested cancellation of a registered race');
        }
      }, function(err) {
        console.error('failed to load old race signup.');
      })
  }
})

expressa.addListener('changed', -10, function(req, collection, doc) {
  if (collection == 'race_signup') {
    expressa.db.users.get(doc.meta.owner)
      .then(function(user) {
        expressa.db.race.get(doc.race_id)
          .then(function(race) {
            if (doc.status == 'pending') {
              console.log('emailing ' + user);
              console.log(doc);
              email.sendRaceConfirmation(user, race)
            }
            if (doc.status == 'cancelled') {
              email.sendRaceCancellation(user, race)
            }
          })
      }, function(err) {
        console.error('invalid user_id in race_signup');
      });
  }
})

expressa.addListener('get', -5, function(req, collection, data) {
  if (collection == 'users') {
    return expressa.db.race_signup.find({ 'meta.owner' : data._id, 'status' : { '$in': ['pending', 'registered'] } })
      .then(function(race_signups) {
        var signup_ids = race_signups.map(function(signup) { return signup._id; });
        data.race_signup_ids = signup_ids;
        var race_ids = race_signups.map(function(signup) { return signup.race_id; });
        if (signup_ids.length) {
          return expressa.db.race.find({ '_id' : { '$in' : race_ids } })
            .then(function(races) {
              data.race_listings = races;
            }, function(err) {
              console.error('failed to lookup full details of user races')
            });
        } else {
          data.race_listings = [];
        }
      }, function(err) {
        console.error('failed to lookup user races')
      });
  }
})

var handler = require('./node_modules/expressa/auth/jwt');
expressa.post('/user/fblogin', function(req, res, next) {
  graph.setAccessToken(req.body.fbAccessToken);
  return graph.getAsync('/me?fields=email')
    .then(function(result) {
      if (result) {
        // check if user exists
        expressa.db.users.find({'email': result.email})
          .then(function(result) {
            if (result.length == 0) {
              return res.status(404).send({error:'No user found with this email.'})
            }
            var user = result[0];
            handler.doLogin(user, req, res, next)
          }, next);
      }
    });
  });

var routes = require('./routes/index')(expressa);

app.use(cors());

app.get('/nearby_races', function(req, res, next) {
  pg.connect(expressa.settings.postgresql_uri, function(err, client, done) {
    if (err) {
      return reject(err, 500);
    }
    var query = "SELECT * FROM race "
    + " WHERE data->>'datetime' >= $4"
     + " ORDER BY "
     + "abs($1::numeric - (data->'location'->'coordinates'->>'lat')::numeric)"
     + " + abs($2::numeric - (data->'location'->'coordinates'->>'lng')::numeric) ASC LIMIT $3;"
    client.query(query, [parseFloat(req.query.lat), parseFloat(req.query.lng),
      parseInt(req.query.limit), new Date().toISOString()], function(err, result) {
      done();
      if (err) {
        console.error(err);
        return res.status(500).send('error getting local races');
      }
      res.send(result.rows.map(function(row) {
        return row.data
      }))
    })
  });
});

app.use(bodyParser.json({ type: "*/*" }))

var auth = require('./node_modules/expressa/auth');

function settingsMiddleware(req, res, next) {
  req.settings = expressa.settings;
  next()
}
app.use('/', settingsMiddleware, auth.middleware, routes);

app.use('/admin', expressa.admin({apiurl:'/'}));
app.use('/', expressa);

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

/*setTimeout(function() {
  //email.sendTestEmail()
  expressa.db.race.get('f5619ec4-1248-4449-afd2-f5ed4b65c4df')
    .then(function(race) {
      email.sendRaceConfirmation({email: 'th4019@gmail.com'}, race)
    });
}, 3000);*/
