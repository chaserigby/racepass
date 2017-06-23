var race_logos = [];

$(function() {
    var panel = document.getElementById('race-logos');
    for (var i = 0; i < race_logos.length; i++) {
        var elem = document.createElement("img");
        elem.setAttribute("src", "logos/" + race_logos[i]);
        elem.setAttribute("class", 'race-logo');
        elem.setAttribute("height", 100);
        elem.setAttribute("width", 150);
        panel.appendChild(elem);
    }
});

$(window).scroll(function(){
    var panel = document.getElementById('race-logos');
    panel.style['margin-left'] = -$(window).scrollTop() + 'px';
});

angular.module('landing', ['ui.slider'])
  .controller('LandingController', function($filter, $http) {
    var self = this;
    this.passPrices = passPrices;
    this.in_results = false;
    this.in_race_details = false;
    this.races = [];
    this.selected_details = {}

    $http.get('https://freegeoip.net/json/')
    .then(function(response) {
      var data = response.data;
      self.zip = window.localStorage.zip = data.zip_code;
      window.localStorage.ip = data.ip;
      window.localStorage.lat = data.latitude;
      window.localStorage.lng = data.longitude;
      self.locationName = data.city;
      console.log('initializing map');
    })

    this.login = function() {
        var login = angular.element(document.getElementsByClassName('login-panel')).scope().login;
        login.isCreation = false;
        $('#myModal').modal()
    }

    this.buy = function(type) {
        localStorage.buyType = type;
        var login = angular.element(document.getElementsByClassName('login-panel')).scope().login;
        login.isCreation = true;
        $('#myModal').modal()
    }

    this.moveMapToLocation = function(addr) {
        $.getJSON('https://maps.googleapis.com/maps/api/geocode/json?address='+addr+'&key=AIzaSyAusDnCayfKbNkDbu6uBiYAgAK3Kk8tEL8', function(data) {
             var bounds = data.results[0].geometry.bounds;
             window.map.fitBounds({
                north: bounds.northeast.lat,
                east: bounds.northeast.lng,
                south: bounds.southwest.lat,
                west: bounds.southwest.lng,
             });
             $('html, body').animate({
                scrollTop: $("#choose-from").offset().top
            }, 1200);
        })
    }
    this.findRaces = function() {
        window.localStorage.email = this.email;
        window.localStorage.zip = this.zip;

        if (!$('#find-races-panel').parsley().validate()) {
            return;
        }

        data = {
          'email': this.email,
          'zip': this.zip,
          'ip': window.localStorage.ip,
          'source': 'home',
        }
        $.post(window.apiurl + 'email_signups', JSON.stringify(data), function(result) {

        });

        this.moveMapToLocation(this.locationName);
    }
    this.updateRaces = function(races) {
        this.races = races;
    }.bind(this);
    this.selectRace = function(race) {
        this.in_race_details = true;
        this.selected = race;
        if (race.images && race.images.length > 0) {
            this.selected_image = race.images[0];
            if (this.selected_image.includes('ultrasign')) {
                this.selected_image += '.jpg';
            }
        } else {
            delete this.selected_image;
        }
        this.selected_details['Distance'] = race.type;
      this.selected_details['City'] = race.location.city;
        this.selected_details['Date'] = $filter('date')(race.datetime, 'MM/dd/yyyy');
    }.bind(this);
    this.mapClose = function() {
        this.in_race_details = false;
        this.in_results = false;
        $('#pac-input').val('');
    };
    this.scrollTo = function(event) {
        event.preventDefault();
        $('html, body').animate({
            scrollTop: $("#choose-pass").offset().top
        }, 1200);
    }
  });

this.in_race_details = false;
$(function() {
    $("#races-near-me").click(function() {
        $('html, body').animate({
            scrollTop: $("#choose-from").offset().top
        }, 1200);
    });
    $("#choose-pass-button").click(function() {
        $('html, body').animate({
            scrollTop: $("#choose-pass").offset().top
        }, 1200);
    });

    $("#menu-find-races").click(function(event) {
        event.preventDefault();
        $('html, body').animate({
            scrollTop: $("#choose-from").offset().top
        }, 1200);
    });
    $("#get-racepass-button").click(function(event) {
        event.preventDefault();
        $('html, body').animate({
            scrollTop: $("#choose-pass").offset().top
        }, 1200);
    });
    $("#menu-explore-passes").click(function(event) {
        event.preventDefault();
        $('html, body').animate({
            scrollTop: $("#choose-pass").offset().top
        }, 1200);
    });
    $("#menu-faq").click(function(event) {
        event.preventDefault();
        $('html, body').animate({
            scrollTop: $("#faq").offset().top
        }, 1200);
    });
});
function onLogin() {
    console.log('logged in');
    $('#myModal').modal('hide')
    FB.api('/me?fields=email,first_name,last_name,gender,timezone,location', function(response) {
        console.log('Successful login for: ' + response.name);
        console.log(response);
    });
}
function fbLoginForLocation() {
    $('html, body').animate({
        scrollTop: $("#map").offset().top
    }, 1200);
}

$(document).ready(function () {
    $('#pass-wrapper').slick({
        dots:true,
        centerMode: true,
        initialSlide: 1,
        variableWidth: true,
    infinite: false,
        responsive: [
            {
                breakpoint: 2500,
                settings: {
          infinite: true,
                    slidesToShow:3,
                    variableWidth: false
                },
            },
            {
                breakpoint: 1000,
                settings: {slidesToShow:1},
            }
        ],
    });
});
