var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser  = require('body-parser');

var graph = require('fbgraph');
var Promise = require("bluebird");
Promise.promisifyAll(graph);
var generator = require('generate-password');

var expressa = require('expressa');
var email = require('./email.js')

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
      return doc;
    })
}

expressa.addListener('post', -10, function(req, collection, doc) {
  if (collection == 'users') {
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
  }
})

expressa.addListener('changed', -10, function(req, collection, doc) {
  if (collection == 'race_signup') {
    expressa.db.users.get(doc.user_id)
      .then(function(user) {
        if (data.status == 'pending') {
          email.sendRaceConfirmation(user, doc)
        }
        if (data.status == 'canceled') {
          email.sendRaceCancellation(user, doc)
        }
      });
  }
})


expressa.addListener('get', -5, function(req, collection, data) {
  if (collection == 'users') {
    if (data.races && data.races.length > 0) {
      return new Promise(function(resolve, reject) {
        expressa.db.race.find({ '_id' : { '$in' : data.races } })
          .then(function(races) {
            data.race_listings = races;
            resolve()
          }, reject)
      })
    }
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

app.use(bodyParser.json({ type: "*/*" }))
app.use('/', routes);

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