'use strict';

module.exports = function(expressa) {
  var express = require('express');
  var braintree = require('braintree');
  var router = express.Router(); // eslint-disable-line new-cap
  var gateway = require('../lib/gateway');

  var TRANSACTION_SUCCESS_STATUSES = [
    braintree.Transaction.Status.Authorizing,
    braintree.Transaction.Status.Authorized,
    braintree.Transaction.Status.Settled,
    braintree.Transaction.Status.Settling,
    braintree.Transaction.Status.SettlementConfirmed,
    braintree.Transaction.Status.SettlementPending,
    braintree.Transaction.Status.SubmittedForSettlement
  ];

  function formatErrors(errors) {
    var formattedErrors = '';

    for (var i in errors) { // eslint-disable-line no-inner-declarations, vars-on-top
      if (errors.hasOwnProperty(i)) {
        formattedErrors += 'Error: ' + errors[i].code + ': ' + errors[i].message + '\n';
      }
    }
    return formattedErrors;
  }

  function createResultObject(transaction) {
    var result;
    var status = transaction.status;

    if (TRANSACTION_SUCCESS_STATUSES.indexOf(status) !== -1) {
      result = {
        header: 'Sweet Success!',
        icon: 'success',
        message: 'Your test transaction has been successfully processed. See the Braintree API response and try again.'
      };
    } else {
      result = {
        header: 'Transaction Failed',
        icon: 'fail',
        message: 'Your test transaction has a status of ' + status + '. See the Braintree API response and try again.'
      };
    }

    return result;
  }

  router.get('/checkouts/new', function (req, res) {
    gateway.clientToken.generate({}, function (err, response) {
      res.send({clientToken: response.clientToken});
    });
  });

  function makePurchase(req, res, promo_amount) {
    promo_amount = promo_amount || 0;

    // prices also in html site in js/base.js
    var passPrices = {
      'freeTrial': 0,
      '3races': 195,
      '5races': 295,
      'unlimited': 695,
    }

    var passRaceCount = {
      'freeTrial': 0,
      '3races': 3,
      '5races': 5,
      'unlimited': 200,
    }

    var amount = Math.max(passPrices[req.body.passType] - promo_amount, 0);
    var nonce = req.body.payment_method_nonce;
    gateway.transaction.sale({
      amount: amount,
      paymentMethodNonce: nonce,
      options: {
        submitForSettlement: true
      }
    }, function (err, result) {
      var data = {
        passType: req.body.passName,
        sku: req.body.passType,
        amount: amount,
        promo_code: req.body.promo,
        uid: req.uid,
      };
      expressa.addMetaData(data, req, res)
      if (result.transaction) {
        data.transaction_id = result.transaction.id;
      }
      if (result.success) {
        data.status = 'success';
        console.log(result);
        expressa.db.users.get(req.uid)
          .then(function(u) {
            u.roles = u.roles || [];
            if (u.roles.indexOf('ActivePass') == -1) {
              u.roles.push('ActivePass');
            }
            u.passType = req.body.passType;
            u.race_credits = (u.race_credits || 0) + passRaceCount[u.passType]
            if (result.transaction) {
              u.transaction_id = result.transaction.id
            }
            expressa.db.users.update(u._id, u);
            data['email'] = u.email,
            expressa.db.user_payments.create(data);
          }, function(err) {
            console.error('invalid user when registering.')
            expressa.db.user_payments.create(data);
          })

        res.status(200).send({"status":"success",
          "cc": result.transaction.creditCard,
          "transaction_id": result.transaction.id});
      } else {
        var transactionErrors = result.errors.deepErrors();
        data.status = 'failure';
        data.errors = JSON.stringify(result.errors.deepErrors());
        res.status(400).send({"status":"failure", "error": transactionErrors});
        expressa.db.user_payments.create(data);
      }
      
    });
  }

  router.post('/purchase', function (req, res) {
    console.log('processing purchase');
    if (!req.body.promo) {
      makePurchase(req, res, 0);
    } else {
      expressa.db.promo_code.find({ 'name' : req.body.promo.toUpperCase() })
        .then(function(results) {
          if (results.length == 0) {
            res.status('400')
            res.send('promo code not found')
            return;
          }
          var promo_amount = results[0].value;
          makePurchase(req, res, promo_amount);
        }, function(err) {
            console.log(err)
           res.status('500')
           res.send('something went wrong.')
        })
    }
  });

  router.post('/partnerships_payment', function (req, res) {
    var transactionErrors;
    var amount = req.body.amount; // In production you should not take amounts directly from clients
    var nonce = req.body.payment_method_nonce;

    gateway.transaction.sale({
      amount: amount,
      paymentMethodNonce: nonce,
      options: {
        submitForSettlement: true
      }
    }, function (err, result) {
      var data = {
        amount: amount,
        num_races: req.body.num_races,
        email: req.body.email,
        organization: req.body.organization,
      };
      if (result.transaction) {
        data.transaction_id = result.transaction.id;
      }
      if (result.success) {
        data.status = 'success';
        console.log(result);
        res.status(200).send({"status":"success",
          "cc": result.transaction.creditCard,
          "transaction_id": result.transaction.id});
      } else {
        transactionErrors = result.errors.deepErrors();
        data.status = 'failure';
        data.errors = JSON.stringify(result.errors.deepErrors());
        res.status(400).send({"status":"failure", "error": transactionErrors});
      }
      expressa.addMetaData(data, req, res)
      expressa.db.partner_payments.create(data);
    });
  });

  return router;
};
