ga('require', 'ecommerce');

function loadBraintree(authorization) {
  var submit = document.querySelector('button[type="submit"]');
  
  braintree.client.create({
    authorization: authorization
  }, function (clientErr, clientInstance) {
    if (clientErr) {
      // Handle error in client creation
      return;
    }
  
    braintree.hostedFields.create({
      client: clientInstance,
      styles: {
        'input': {
          'font-size': '14px',
          'font-weight': '300',
          'background-color': 'white',
        },
        'input.invalid': {
          'color': 'red'
        },
        'input.valid': {
          'color': 'black'
        }
      },
      fields: {
        number: {
          selector: '#card-number',
          placeholder: 'Card Number'
        },
        cvv: {
          selector: '#cvv',
          placeholder: 'CVC'
        },
        expirationDate: {
          selector: '#expiration-date',
          placeholder: 'MM/YYYY'
        }
      }
    }, function (hostedFieldsErr, hostedFieldsInstance) {
      if (hostedFieldsErr) {
        // Handle error in Hosted Fields creation
        return;
      }
      window.hostedFieldsInstance = hostedFieldsInstance;
  
      submit.removeAttribute('disabled');
    });
  });
}

angular.module('payment', [])
  .controller('PaymentController', function($timeout, $scope) {
    var self = this;
    this.email = window.localStorage.email || '';
    this.cost_per_event = 45;

    //this.num_races = 1;

    this.getFinalCost = function() {
      return this.num_races * this.cost_per_event;
    };

    this.purchaseInProgress = false;
    this.paymentComplete = false;
    this.setError = function(err) {
      this.error = err;
      this.purchaseInProgress = false;
      $scope.$apply();
    }.bind(this);
    this.purchase = function() {
      this.purchaseInProgress = true;
      hostedFieldsInstance.tokenize(function (tokenizeErr, payload) {
        if (tokenizeErr) {
          // Handle error in Hosted Fields tokenization
          console.log(tokenizeErr);
          self.setError('Some payment input fields are invalid. Please check and try again.')
          return;
        }

        var paymentData = {
          payment_method_nonce: payload.nonce,
          email: self.email,
          organization: self.organization,
          amount: self.getFinalCost(),
          num_races: self.num_races,
        };
        $.post(window.apiurl + 'partnerships_payment', JSON.stringify(paymentData))
          .then(function(data) {
            console.log(data);
            delete paymentData.payment_method_nonce;
            paymentData.details = data.transaction_id;
            window.localStorage.payment = JSON.stringify(paymentData);
            ga('ecommerce:addItem', {
              'id': data.transaction_id,        // Transaction ID. Required.
              'name': 'Race Partnership',
              'sku': 'partner1',
              'price': self.cost_per_event,
              'quantity': self.num_races,
            });
            ga('ecommerce:addTransaction', {
              'id': data.transaction_id,        // Transaction ID. Required.
              'affiliation': 'racepass',        // Affiliation or store name.
              'revenue': self.getFinalCost(),   // Grand Total.
              'tax': '0'                        // Tax.
            });
            ga('ecommerce:send');
            window.location = '/partnership-payment-complete'
          }, function(data) {
            self.setError('We ran into an issue while processing your card. Please try again and contact info@racepass.com if the issue continues. Thanks for your patience.')
            console.error(data);
          });
      });
    }.bind(this);
  });