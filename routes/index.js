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

  router.get('/', function (req, res) {
    res.redirect('/checkouts/new');
  });

  router.get('/checkouts/new', function (req, res) {
    gateway.clientToken.generate({}, function (err, response) {
      res.send({clientToken: response.clientToken});
    });
  });

  router.post('/purchase', function (req, res) {
    var nonce = req.body.payment_method_nonce;
    var detailMap = {
      'Contender': {
        'cost': 195
      },
      'Challenger': {
        'cost': 349
      },
      'Contender': {
        'cost': 799
      }
    };
    gateway.transaction.sale({
      amount: detailMap[req.body.passType].cost,
      paymentMethodNonce: nonce,
      options: {
        submitForSettlement: true
      }
    }, function (err, result) {
      if (result.success || result.transaction) {
        res.send({"status":"success", "transaction_id": result.transaction.id});
      } else {
        var transactionErrors = result.errors.deepErrors();
        res.send({"status":"failure", "error": transactionErrors});
      }
    });
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
      expressa.db.partner_payments.create(data);
    });
  });

  return router;
};