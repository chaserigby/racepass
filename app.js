var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser  = require('body-parser');

var expressa = require('expressa');

expressa.addListener('post', 0, function(req, collection, doc) {
  if (collection == 'users') {
    if (doc.transaction_id) {
      return expressa.db.user_payments.find({'transaction_id': doc.transaction_id})
        .then(function(results) {
          if (results.length > 0) {
            doc.roles = doc.roles || [];
            doc.roles.push('ActivePass');
            doc.passType = results[0]['sku'];
            results[0].linked_user = doc.email;
            expressa.db.user_payments.update(results[0]._id, results[0]);
          }
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