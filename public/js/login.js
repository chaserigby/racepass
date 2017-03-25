// On the home page, no module has been defined yet
if (typeof app == 'undefined') {
  app = angular.module('landing');
} 

function LoginController($filter, $location, $scope, $timeout, $http) {
  var self = this;
  try {
    this.payment = JSON.parse(window.localStorage.payment);
  }
  catch (e) {
    console.error('no payment');
  }
  this.isCreation = !!this.payment && window.location.pathname.indexOf('app') != -1;
  console.log('isCreation ' + this.isCreation)

  this.facebook = function(success, reg) {
    if (self.isCreation) {
      self.facebookRegister(success, reg);
    } else {
      
    }
  }

  this.facebookRegister= function(fbAccessToken) {
    data = {
      'fbAccessToken': fbAccessToken,
    }
    $.post(window.apiurl + 'user/register', JSON.stringify(data))
      .then(function(result) {
        self.facebookLogin(fbAccessToken);
      }, function(err) {
        if (err.status == '409') {
          return toastr.error('a user with this email already exists');
        }
        toastr.error('error creating an account with Facebook');
      });
  };
  this.pwdRegister = function(success) {
    data = {
      'email': this.email,
      'password': this.password,
    }
    $.post(window.apiurl + 'user/register', JSON.stringify(data))
      .then(function(result) {
        self.pwdLogin(success);
      }, function(err) {
        if (err.status == 409) {
          toastr.error('An account with this emali already exists.');
        } else {
          toastr.error('error creating an account');
        }
      })
  }.bind(this);

  this.facebook = function() {
    FB.login(function(response) {
      self.facebookLogin(response.authResponse.accessToken, function() {
        self.facebookRegister(response.authResponse.accessToken);
      })
    }, {scope: 'public_profile,email,user_birthday,user_location'});
  }

  this.facebookLogin = function(fbAccessToken, onErr) {
    data = {
      'fbAccessToken': fbAccessToken,
    }
    console.log(data);
    $.post(window.apiurl + 'user/fblogin', JSON.stringify(data))
      .then(function(result) {
        window.localStorage.token = result.token;
        window.localStorage.uid = result.uid;
        window.location = '/app'
      }, function(err) {
        if (err.status == 404) {
          // if no account try creating one
          return onErr();
          //return self.facebookRegister()
          //return toastr.error('No account with this Facebook\'s email exists.');
        }
        toastr.error('error logging in with Facebook');
      })
  }

  this.pwdLogin = function() {
    data = {
      'email': this.email,
      'password': this.password,
    }
    $http.post(window.apiurl + 'user/login', JSON.stringify(data))
      .then(function(result) {
        window.localStorage.token = result.data.token;
        window.localStorage.uid = result.data.uid;
        window.location = '/app'
      }, function(result) {
        result.data = result.data || {};
        toastr.error(result.data.error || 'error logging in');
      })
  }.bind(this);
}