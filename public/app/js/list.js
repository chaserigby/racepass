angular.module('main').controller('ListController', function($timeout, $filter,
                                                             $http, $location) {
  this.raceInfo = [];
  this.offset = 0;
  this.limit = 10;
  this.hasNextPage = true;

  this.populateRaceInfo = function() {
    var self = this;
    $http
        .get(window.apiurl + 'race?offset=' + this.offset +
             '&limit=' + (this.limit + 1) + '&token=' + localStorage.token)
        .then(function(result) {
          var data = result.data;
          self.hasNextPage = data.length > self.limit;
          self.raceInfo = result.data.slice(0, self.limit);
        });
  }.bind(this);

  this.getNavMessage = function() {
    return 'Results ' + (this.offset + 1) + ' through ' +
           (this.offset + this.limit) + ' of many';
  }.bind(this);

  this.getPreviousPage = function() {
    this.offset = Math.max(0, this.offset - this.limit);
    this.populateRaceInfo();
  }.bind(this);

  this.getNextPage = function() {
    this.offset += this.limit;
    this.populateRaceInfo();
  }.bind(this);

  this.populateRaceInfo();
});
