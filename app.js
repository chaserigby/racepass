var express = require('express');
var app = express();

var expressa = require('expressa');
app.use('/admin', expressa.admin({apiurl:'/'}));

var expressaSwagger = require('expressa-swagger')
expressaSwagger({
  expressa: expressa, 
  app: app, 
  url: '/api/doc', 
  title: 'My appname', 
  description: "Lorem ipsum `markdown`",  // or just pass  __dirname+"/API.md" e.g.
  version: '1.0.0', 
  apiurl: '/', 
  schemes: ["http"], 
  onDocumentation: function(swagger, req, res, next){
    // optionally hide/modify swagger data here, or add auth middleware 
    // before serving it to the documentation generator at /api/doc
  }
})

app.use('/', expressa);

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

//AIzaSyAusDnCayfKbNkDbu6uBiYAgAK3Kk8tEL8
app.get('/import', function(req, res) {
	console.log(req);
});