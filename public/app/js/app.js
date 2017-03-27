app = angular.module('main', ['ngRoute', 'ui.slider'])

app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        templateUrl : "app/templates/profile.html",
        controller: 'MainController as main'
    })
    .when("/search", {
        templateUrl : "app/templates/search.html",
        controller: 'SearchController as search'
    })
    .when("/registration", {
        templateUrl : "app/templates/registration.html",
        controller: 'RegistrationController as reg'
    })
    .when("/payment", {
        templateUrl : "app/templates/payment.html",
        controller: 'PaymentController as payment'
    })
});

app.controller('MainController', function($location, $http, $scope, $timeout) {
    var self = this;

    if (!window.localStorage.token) {
      $location.path('/registration');
    }

    this.update_user_info = function() {
      $http.get(window.apiurl + 'user/me' + '?token=' + localStorage.token)
        .then(function(result) {
          var response = result.data;
          if (!response.address || !response.address.line1) {
            $location.path('/registration');
          }
          if (!response.paymentSkipped && !response.passType) {
            $location.path('/payment');
          }
          this.user = response;
          this.passName = passNames[this.user.passType];
          this.age = calculateAge(new Date(this.user.date_of_birth));
          this.photo = 'https://graph.facebook.com/'+this.user.facebook_id+'/picture?type=large&w‌​idth=720&height=720'
          this.my_races = response.race_listings;
          if (this.user.passType == 'unlimited') {
            this.racesLeft = 'unlimited';
          } else {
            this.racesLeft = passRaceCount[this.user.passType] - this.my_races.length;
          }
          this.my_race_signup_ids = response.race_signup_ids;
          if (this.user.address && this.user.address.coordinates) {
            localStorage.lat = this.user.address.coordinates.lat;
            localStorage.lng = this.user.address.coordinates.lng;
            localStorage.city = this.user.address.city;
          }
        }.bind(this));
    };

    this.update_user_info();

    var today = new Date();
    var nextWeek = new Date();
    nextWeek.setDate(today.getDate()+31);
    var dist = 0.5;
    /*var query = {
      'datetime': {
        '$gt': today.toISOString(),
        '$lt': nextWeek.toISOString(),
      },
      'location.coordinates.lat': {
        "$gt": localStorage.lat - dist,
        "$lt": localStorage.lat + dist,
      },
      'location.coordinates.lng': {
        "$gt": localStorage.lng - dist,
        "$lt": localStorage.lng + dist,
      }
    };*/
    $http.get(window.apiurl + 'nearby_races?limit=8&lat='+localStorage.lat+'&lng='+localStorage.lng)
      .then(function(response) {
        this.upcoming_races = response.data;
      }.bind(this));

    this.buy = function() {
      $location.path('payment');
    }

    this.cancellation_reasons = [
      'Lost motivation',
      'No friends or family racing',
      'Work / travel conflict',
      'Didn’t train enough',
      'Worried about racing injury',
      'Didn’t like previous race(s)',
      'I’ve suffered an illness / injury',
      'Bereavement',
      'Other',
    ];

    this.results = [];
    this.search_focus = false;

    this.formatRaceDistance = formatRaceDistance;

    this.search = function() {
      var query = this.search_text;
      if (!query) {
        this.results = [];
        return;
      }
      combinedSearch(query, function(results) {
        this.results = results;
        console.log('applying ' + query);
        $scope.$apply();
      }.bind(this));

      //$location.path('/search');
    }.bind(this);

    this.lostFocus = function() {
      $timeout(function() {
        this.search_focus = false;
      }.bind(this), 100);
    }

    this.selectSearchResult = function(choice) {
      var appElement = document.querySelector('#map');
      if (!appElement) {
        window.selectedResult = choice;
        $location.path('/search');
      } else {
        var $scope = angular.element(appElement).scope();
        $scope.search.selectSearchResult(choice);
        console.log($scope)
      }
      this.results = [];
      this.search_text = '';
    }.bind(this);

    this.select_cancellation = function(reason) {
      this.cancellation_reason = reason;
    }.bind(this);
    this.submit_cancellation = function() {
        $('#cancelModal').modal('hide');
        self.remove_race(self.cancel_index);
    }
    this.cancel_popup = function(i) {
        $('#cancelModal').modal('show');
        self.cancel_index = i;
    }
    this.get_cancellation_reason = function() {
      var reason = this.cancellation_reason;
      if (reason == "Other") {
        return this.cancellation_reason_other;
      }
      return reason;
    }
    this.remove_race = function(i) {
      var signup_id = self.my_race_signup_ids[i];

      data = {
        '$set': { 'status': 'canceled', 'cancellation_reason': self.get_cancellation_reason() }
      }
      $http.post(window.apiurl + 'race_signup/' + signup_id + '/update?token=' + localStorage.token, JSON.stringify(data))
        .then(function(result) {
          self.update_user_info();
        })

      delete self.cancellation_reason;
      delete self.cancellation_reason_other;
    };

    this.race_register = function(race) {
      race_signup = {
        'race_id' : race._id,
        'status' : 'pending',
      };
      $http.post(window.apiurl + 'race_signup/?token=' + localStorage.token, JSON.stringify(race_signup))
        .then(function(result) {
          self.update_user_info();
        }, function(err) {
          console.error(err);
          toastr.info(err.data);
        });
    }

    this.types = ['5k', '10k', 'Obstacle/Relay', '13.1mi', '26.2mi', 'Ultramarathon'];
    this.types_enabled = {
      '5k': true,
      '10k': true,
      'Obstacle/Relay': false,
      '13.1mi': true,
      '26.2mi': true,
      'Ultramarathon': false,
    };

    this.toggle = function(type) {
      this.types_enabled[type] = !this.types_enabled[type];
    }.bind(this);
  });
