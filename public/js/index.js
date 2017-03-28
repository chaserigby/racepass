//var race_logos = ['107th Thanksgiving Day Race logo.png','Across the bay 10k logo.png','AJC Peachtree Road Race Logo.jpg','Army Ten Miler Logo.jpg','Bank of America Shamrock Shuffle.jpeg','Blue Cross Blue Shield Broad Street Run 10 Miler.jpg','Bolder Boulder Logo.png','Boston Marathon Logo.png','Brooklyn Half Marathon Logo.png','Cherry Blossom run Logo.jpg','Chicago Marathon Logo.jpg','Cooper River Bridge Run Logo.jpg','Country Music Marathon and Half Marathon Nashville logo.jpg','Crescent City Classic 10k.jpg','Disney Princess Half Marathon Weekend logo.png','Gate River Run logo.jpg','Great aloha run logo.png','Hot Cholocate 15k_5k Logo.png','LA Marathon logo.jpg','Lilac Bloomsday Run Logo.jpg','Marine Corps Marathon logo.JPG','Nike womens half marathon sf logo.jpg','NYC Half Marathon logo.png','Ohio State Four Miler logo.jpg','Oneamerica 500 Festival Mini-marathon.jpg','Pats Run logo .png','Pittsburgh_Marathon logo.png','Rock n roll marathon las vegas logo.png','Rock n Roll Philadelphia Half logo.png','Rock N Roll Series generic logo.png','San Diego Rock N Roll Marathon logo.jpeg','San Francisco Marathon logo.jpg','Spartan Race logo 2.jpg','Spartan Race logo.png','Statesman Capitol 10k logo.png','SurfCity marathon logo.png','the-color-run-logo.png','TJC New York City Marathon.png','Tough Mudder Logo .png','Ukrop Monument Ave 10K logo.png','Walt Disney World Marathon Weekend.png','Zappos.com Bay to Breakers Logo.png'];
var race_logos = ['107th Thanksgiving Day Race logo.png','Across the bay 10k logo.png','AJC Peachtree Road Race Logo.jpg','Army Ten Miler Logo.jpg','Bank of America Shamrock Shuffle.jpeg','Blue Cross Blue Shield Broad Street Run 10 Miler.jpg','Bolder Boulder Logo.png','Cherry Blossom run Logo.jpg','Cooper River Bridge Run Logo.jpg','Country Music Marathon and Half Marathon Nashville logo.jpg','Crescent City Classic 10k.jpg','Gate River Run logo.jpg','Great aloha run logo.png','Honolulu Marathon.jpg','Hot Cholocate 15k_5k Logo.png','Lilac Bloomsday Run Logo.jpg','NYC Half Marathon logo.png','Ohio State Four Miler logo.jpg','Oneamerica 500 Festival Mini-marathon.jpg','Pat\'s Run logo .png','Pittsburgh_Marathon logo.png','Rock N Roll Series generic logo.png','San Francisco Marathon logo.jpg','Statesman Capitol 10k logo.png','SurfCity marathon logo.png','the-color-run-logo.png','Ukrop Monument Ave 10K logo.png','Zappos.com Bay to Breakers Logo.png'];

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
  //$("#div").css({"margin-top": ($(window).scrollTop()) + "px", "margin-left":($(window).scrollLeft()) + "px"});
});

angular.module('landing', ['ui.slider'])
  .controller('LandingController', function($filter, $http) {
    var self = this;
    this.passPrices = passPrices;
    this.in_results = false;
    this.in_race_details = false;
    this.races = [];
    this.selected_details = {}
    this.prevInfowindow = null;
    this.prevHighlight = null;

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
        if (this.prevInfowindow != null) {
            this.prevInfowindow.close();
            //this.prevInfowindow = null;
        }
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
    this.highlightRace = function(race) {
        if (this.prevHighlight == race) {
            return;
        }
        if (this.prevInfowindow != null) {
            this.prevInfowindow.close();
        }

        var content = '<div style="padding: 21px; white-space: nowrap; text-align: center;">' +
            '<div class="p-name">' + race.name + '</div>' +
            '<span class="p-distance">' + race.type + '</span> • ' +
            '<span class="p-date">' +$filter('date')(race.datetime, 'MM/dd/yyyy') + '</span>' +
            '</div>';

        var infowindow = new InfoBubble({
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
        this.prevInfowindow = infowindow;
        this.prevHighlight = race;
    };
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

setTimeout("document.getElementById('search-location').focus();", 1500);
setTimeout("document.getElementById('search-location').focus();", 3000);

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