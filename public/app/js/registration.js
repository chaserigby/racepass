app = angular.module('main')

app.controller('RegistrationController', function($location, $http, $scope, $timeout) {
  var self = this;
  this.page = 1;
  if (localStorage.token) {
    this.page = 2;
  } else {
    window.location = '/'
  }
  this.data = {
    address: {},
    raceinfo: {},
  };
  $http.get(window.apiurl + 'user/me' + '?token=' + localStorage.token)
    .then(function(response) {
      console.log(response);
      self.data = response.data;
      if (self.data.date_of_birth) {
        self.data.date_of_birth = new Date(self.data.date_of_birth);
      }
    });
  this.next = function() {
    if (this.page == 1) {
      this.page++;
      $scope.$apply();
    } else if ($('#p' + this.page).parsley().validate()) {
      if (this.page == 4) {
        this.data.raceinfo.has_medical = (this.data.raceinfo.has_medical == 'true');
        data = {
          $set: this.data
        }
        $.post(window.apiurl + 'users/' + localStorage.uid + '/update?token=' + localStorage.token, JSON.stringify(data))
          .then(function(result) {
            console.log(result);
            $location.path('/');
            //window.location = '/app';
            $scope.$apply();
          }, function(err) {
            console.error('error signing in');
            console.error(err);
          })
      } else {
        this.page++;
      }
    }
  }.bind(this);
  this.toggleMedical = function() {
    if (this.data.raceinfo.has_medical == 'true') {
      $('#medicalModal').modal('toggle');
    }
  }.bind(this);
});