'use strict';

var braintree = require('braintree');
var environment, gateway;

environment = 'Sandbox'

gateway = braintree.connect({
  environment: braintree.Environment[environment],
  merchantId: 'fgczyhsqswsm3gy7',
  publicKey: 'hp46dv47hxtp7kjc',
  privateKey: '2a8daed3f5d78c6a5ffa10a632e6af15'
});

module.exports = gateway;