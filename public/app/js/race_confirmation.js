function RaceConfirmationController($filter, $location, $scope, $timeout, $http) {
  var self = this;

  self.distance = ''
  self.race = {};

  self.update = function(race, callback) {
    self.race = race;
    self.distance = race.distance;
    self.callback = callback;
  }

  self.next = function() {
    self.distance = self.distance_temp
  }

  self.finish_race_register = function() {
    race_signup = {
      'race_id' : self.race._id,
      'distance' : '' + self.distance,
      'status' : 'pending',
    };
    $http.post(window.apiurl + 'race_signup/?token=' + localStorage.token, JSON.stringify(race_signup))
      .then(function(result) {
        self.callback();
      }, function(err) {
        console.error(err);
        toastr.info(err.data);
      });
  }
}