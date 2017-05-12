angular.module('main').controller(
    'ListController', function($timeout, $filter, $http, $location) {
      this.raceInfo = [];

      this.populateRaceInfo = function() {
        var self = this;
        $http.get(window.apiurl + 'race?limit=10&token=' + localStorage.token)
            .then(function(result) { self.raceInfo = result.data; });
      }.bind(this);

      this.populateRaceInfo();
    });
