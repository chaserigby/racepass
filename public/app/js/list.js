angular.module('main').controller(
    'ListController', function($timeout, $filter, $http, $location) {
      this.raceInfo = [];

      this.query = {};
      this.nameFilter = null;
      this.locationFilter = null;

      this.offset = 0;
      this.limit = 10;

      this.hasNextPage = true;
      this.resultSize = null;
      this.navMessage = '';

      this.populateRaceInfo = function() {
        var self = this;
        $http
            .get(window.apiurl + 'race?query=' + JSON.stringify(this.query) +
                 '&offset=' + this.offset + '&limit=' + (this.limit + 1) +
                 '&token=' + localStorage.token)
            .then(function(result) {
              var data = result.data;
              self.hasNextPage = data.length > self.limit;
              self.raceInfo = result.data.slice(0, self.limit);
              self.updateNavMessage();
            });
      }.bind(this);

      this.updateQuery = function() {
        var subQueries = [];
        if (this.nameFilter) {
          subQueries.push(createStringContainsQuery('name', this.nameFilter));
        }
        if (this.locationFilter) {
          var locationRegex = '.*' + this.locationFilter + '.*';
          var cityQuery =
              createStringContainsQuery('location.city', this.locationFilter);
          var stateQuery =
              createStringContainsQuery('location.state', this.locationFilter);
          subQueries.push({$or : [ cityQuery, stateQuery ]});
        }
        if (subQueries.length > 0) {
          this.query = {$and : subQueries};
        } else {
          this.query = {};
        }
        this.offset = 0;
        this.resultSize = null;
        this.populateRaceInfo();
      }.bind(this);

      function createStringContainsQuery(key, filter) {
        var regex = '.*' + filter + '.*';
        var query = {};
        query[key] = {$regex : regex, $options : 'i'};
        return query;
      }

      this.updateNavMessage = function() {
        if (!this.hasNextPage) {
          this.resultSize = this.offset + this.raceInfo.length;
        }
        this.navMessage = 'Showing ' + (this.offset + 1) + ' through ' +
               (this.hasNextPage ? this.offset + this.limit : this.resultSize) +
               ' of ' + (this.resultSize || 'many');
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
