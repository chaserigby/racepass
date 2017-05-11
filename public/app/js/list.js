angular.module('main').controller(
    'ListController', function($timeout, $filter, $http, $location) {
      this.raceInfo = [];

      this.populateRaceInfo = function() {
        $http.get(window.apiurl + 'race?limit=10&token=' localStorage.token)
            .then(function(result) { this.raceInfo = result.data; });
      }.bind(this);
    });
