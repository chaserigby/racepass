var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser  = require('body-parser');

var graph = require('fbgraph');
var Promise = require("bluebird");
Promise.promisifyAll(graph);
var generator = require('generate-password');

var expressa = require('expressa');

function populateUserFromFacebook(doc) {
  graph.setAccessToken(doc.fbAccessToken);
  return graph.getAsync('/me?fields=email,first_name,last_name,gender,timezone,hometown,location,friends')
    .then(function(res) {
      if (res) {
        doc.email = res.email;
        doc.first_name = res.first_name;
        doc.last_name = res.first_name;
        doc.gender = res.gender;
        doc.password = generator.generate({
            length: 20,
            numbers: true
        });
        doc.facebook_id = res.id;
        delete doc.fbAccessToken;
      }
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

var routes = require('./routes/index')(expressa);

app.use(cors());

app.use(bodyParser.json({ type: "*/*" }))
app.use('/', routes);

app.use('/admin', expressa.admin({apiurl:'/'}));
app.use('/', expressa);

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});