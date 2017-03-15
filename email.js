var emailjs = require('emailjs');
var fs = require('fs');
var Handlebars = require('handlebars');
var moment = require('moment');

var html = {};
var text = {};

function loadEmail(name) {
  html[name] = Handlebars.compile(fs.readFileSync('emails/' + name + '.html').toString());
  text[name] = Handlebars.compile(fs.readFileSync('emails/' + name + '.txt').toString());
}
loadEmail('welcome');
loadEmail('race_confirmation');
loadEmail('race_cancellation');


function send(templateName, dest, subject, data) {
  var server  = emailjs.server.connect({
     user:    "apikey", 
     password:"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", 
     host:    "smtp.sendgrid.net", 
     ssl:     true
  });

  server.send({
     text:    text[templateName](data), 
     from:    "info@racepass.com", 
     to:      dest,
     //cc:      "else <else@your-email.com>",
     subject: subject,
     attachment: [ {data: html[templateName](data), alternative:true} ]
  }, function(err, message) { console.log(err || message); });
}

exports.sendTestEmail = function() {
  //send('welcome', 'th4019@gmail.com', 'Welcome to the community!');
  send('race_confirmation', 'th4019@gmail.com', 'Registration Confirmed', { 'data': {
    'name': 'Big Sur Marathon',
    'start_time': '8:00 AM',
    'date': '3/3/2017',
    'distance': '13.1',
    'website': 'http://bigsurmarathon.com',
  }});
}

exports.sendWelcomeEmail = function(user) {
  send('welcome', user.email, 'Welcome to the community!');
	console.log('emailing ' + user.email);
}

exports.sendRaceConfirmation = function(user, race) {
  send('race_confirmation', user.email, 'Registration Confirmed', { 'data': {
    'name': race.name,
    'start_time': moment(race.datetime).format('h:mm a'),
    'date': moment(race.datetime).format('l'),
    'distance': race.type,
    'website': race.website
  }});
}

exports.sendRaceCancellation = function(user, race) {
  send('race_cancellation', user.email, 'Registration Confirmed', { 'data': {
    'name': race.name,
    'start_time': moment(race.datetime).format('h:mm a'),
    'date': moment(race.datetime).format('l'),
    'distance': race.type,
    'website': race.website
  }});
}