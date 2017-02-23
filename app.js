var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser  = require('body-parser');

var expressa = require('expressa');

var routes = require('./routes/index')(expressa);

app.use(cors());

app.use(bodyParser.json({ type: "*/*" }))
app.use('/', routes);

app.use('/admin', expressa.admin({apiurl:'/'}));
app.use('/', expressa);

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
