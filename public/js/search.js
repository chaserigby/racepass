var infowindow;

// On the home page, no module has been defined yet
if (typeof app == 'undefined') {
  app = angular.module('landing');
}

var backup_race_images = [
  '/imgs/stock/running1.jpg',
  '/imgs/stock/iStock-498663644.jpg',
  '/imgs/stock/iStock-501644332.jpg',
  '/imgs/stock/iStock-587513024.jpg'
];

app
  .controller('SearchController', function($filter, $scope, $timeout, $location, $http) {
    var self = this;

    this.types = ['5k', '10k', 'Obstacle/Relay', '13.1mi', '26.2mi', 'Ultramarathon'];
    this.types_enabled = {
      '5k': true,
      '10k': true,
      'Obstacle/Relay': false,
      '13.1mi': true,
      '26.2mi': true,
      'Ultramarathon': false,
    };

    if (typeof $scope.full_mode != 'undefined') {
      this.full_mode = $scope.full_mode;
    } else {
      this.full_mode = true;
    }

    this.popup_open = '';

    this.containerclick = function() {
      this.popup_open = false;
    }

    this.popupclick = function(event) {
      event.stopPropagation();
    }

    this.slider_types = ['1K', '5K', '10K', '15K', '13.1 mile', '26.2 mile'];
    this.slider_types_range = [0, 5];
    this.slider_types_values = [0, 5, 10, 15, 21.09, 42.19];

    this.slider_homedist = ['1 mile', '5 miles', '10 miles', '25 miles', '50 miles', 'inf'];
    this.slider_homedist_values = [0,5,10,25,50,10000]
    this.slider_homedist_range = [0, 5];
    this.button_types = {
      'Fun Run': true,
      'Obstacle': true,
      'Relay': false,
    };

    this.reset_types = function() {
      this.slider_types_range = [0, 5];
      this.button_types = {
        'Fun Run': true,
        'Obstacle': true,
        'Relay': false,
      };
      this.popup_open = '';
      this.update();
    }
    this.reset_homedists = function() {
      this.slider_homedist_range = [0, 5];
      this.popup_open = '';
      this.update();
    }

    if (localStorage.city && localStorage.city != 'undefined') {
      this.city = localStorage.city
    } else {
      this.city = 'home';
    }


    this.panel = '';
    this.races = [];
    this.selected_details = {}
    this.prevInfowindow = null;
    this.prevHighlight = null;

    this.start_date = $filter('date')(new Date(), 'MM/dd/yyyy');
    this.end_date = $filter('date')(new Date().setDate(new Date().getDate() + 364)  , 'MM/dd/yyyy');

    this.update = function() {
      this.query = {
        "datetime": {
          "$gte": new Date(this.start_date).toISOString(),
          "$lt": new Date(this.end_date).toISOString(),
        }
      }
      if (window.updateMap)
        window.updateMap(this);
      if (window.selectedResult) {
        self.selectSearchResult(window.selectedResult);
        window.selectedResult = null;
      }
    }

    this.results = [];
    this.search_focus = false;

    this.search = function() {
      var query = this.search_text;

      if (!query) {
        return;
      }

      //service = new google.maps.places.PlacesService(window.map);

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
      }.bind(this), 300);
    }

    this.selectSearchResult = function(choice) {
      console.log(choice);
      if (choice.place_id) {
        var geocoder = new google.maps.Geocoder;
        geocoder.geocode({'placeId': choice.place_id}, function(results, status) {
          if (status === 'OK') {
            if (results[0]) {
              window.map.fitBounds(results[0].geometry.bounds);
            }
          }
        });
        if (this.full_mode) {
          this.panel = 'results';
        }
      } else {
        circle = new google.maps.Circle({radius: 1500, center: choice.location});
        //bounds.extend(circle.getBounds());

        // this delay makes the map update location when seaching from other pages
        setTimeout(function() {
          window.map.fitBounds(circle.getBounds());
        }, 300);
        self.selectRace(choice.race);
      }
    }.bind(this);

    this.updateRaces = function(races) {
      this.races = races;
      if (this.full_mode && localStorage.lat) {
        this.races.forEach(function(race) {
          var a = new google.maps.LatLng(localStorage.lat, localStorage.lng);
          var b = new google.maps.LatLng(race.location.coordinates);
          var dist = google.maps.geometry.spherical.computeDistanceBetween(a, b);
          var mileToMeter = 0.000621371;
          race.distanceFromHome = Math.round(dist * mileToMeter);
        });

        this.races = this.races.filter(function(race) {
          var mn = this.slider_homedist_values[this.slider_homedist_range[0]]
          var mx = this.slider_homedist_values[this.slider_homedist_range[1]]
          return race.distanceFromHome >= mn && race.distanceFromHome <= mx;
        }.bind(this));

        this.races = this.races.filter(function(race) {
          if (this.slider_types_range[0] == 0 && this.slider_types_range[1] == 5
              && typeof race.distance == 'undefined') {
            // don't exclude races without distances when no filter is set.
            return true;
          }
          var mn = this.slider_types_values[this.slider_types_range[0]]
          var mx = this.slider_types_values[this.slider_types_range[1]]
          return (race.distance >= (mn - .1) && race.distance <= (mx + .1));
        }.bind(this));
      }
      if (this.prevInfowindow != null) {
        this.prevInfowindow.close();
        //this.prevInfowindow = null;
      }
      return this.races;
    }.bind(this);

    this.selectRace = function(race) {
      this.panel = 'details';
      this.selected = race;
      if (race.images && race.images.length > 0) {
        this.selected_image = race.images[0];
        if (this.selected_image.includes('ultrasign')) {
          this.selected_image += '.jpg';
        }
      } else {
        // choose a random backup image to use
        this.selected_image = backup_race_images[Math.floor(Math.random()*backup_race_images.length)];
      }
      if (typeof race.distance != 'undefined' && race.distance) {
        this.selected_details['Distance'] = formatRaceDistance(race.distance);
      } else {
        delete this.selected_details['Distance'];
      }
      this.selected_details['City'] = race.location.city;
      this.selected_details['Date'] = $filter('date')(race.datetime, 'MM/dd/yyyy');
    }.bind(this);

    this.register = function() {
      $('#raceConfirmModal').modal('show')
      var race = self.selected;
      var appElement = document.querySelector('#raceconfirmation-contents');
      var $scope = angular.element(appElement).scope();
      $scope.raceconfirmation.update(race, function() {
          $location.path('/');
          $('#raceConfirmModal').modal('hide')
      })
    }

    this.scheduledPopups = [];

    this.schedulePopup = function(race) {
      if (this.panel == 'details') {
        return;
      }
      this.scheduledPopups = [race];
      setTimeout(function() {
        var index = this.scheduledPopups.indexOf(race);
        if (index != -1) {
          this.highlightRace(race);
          this.scheduledPopups.splice(index, 1);
        }
      }.bind(this), 350);
    }
    this.cancelPopup = function(race) {
      var index = this.scheduledPopups.indexOf(race);
      if (index != -1) {
        this.scheduledPopups.splice(index, 1);
      }
    }

    this.highlightRace = function(race) {
      return;

      this.prevHighlightTime = new Date().getTime();
      if (this.prevHighlight == race) {
        return;
      }

      var content = '<div style="padding: 21px; white-space: nowrap; text-align: center;">' +
        '<div class="p-name">' + race.name + '</div>' +
        '<span class="p-distance">' + race.type + '</span> • ' +
        '<span class="p-date">' +$filter('date')(race.datetime, 'MM/dd/yyyy') + '</span>' +
        '</div>';

      if (infowindow) {
        infowindow.close();
      }
      infowindow = new InfoBubble({
          map: map,
          content: content,
          //position: new google.maps.LatLng(race.location.coordinates.lat, race.location.coordinates.lng),
          position: race.temp.marker.getPosition(),
          shadowStyle: 1,
          padding: 0,
          backgroundColor: '#323237',
          borderRadius: 4,
          arrowSize: 10,
          borderWidth: 1,
          borderColor: '#2c2c2c',
          disableAutoPan: true,
          hideCloseButton: true,
          arrowPosition: 30,
          backgroundClassName: 'phoney',
          arrowStyle: 2
        });
      infowindow.open();
      this.prevHighlight = race;
    }.bind(this);

    this.mapClose = function() {
      this.panel = '';
      $('#pac-input').val('');
    }.bind(this);

    this.update();

  });
