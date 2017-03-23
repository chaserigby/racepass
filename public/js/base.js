/* Heap Analytics */
window.heap=window.heap||[],heap.load=function(e,t){window.heap.appid=e,window.heap.config=t=t||{};var r=t.forceSSL||"https:"===document.location.protocol,a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=(r?"https:":"http:")+"//cdn.heapanalytics.com/js/heap-"+e+".js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(a,n);for(var o=function(e){return function(){heap.push([e].concat(Array.prototype.slice.call(arguments,0)))}},p=["addEventProperties","addUserProperties","clearEventProperties","identify","removeEventProperty","setEventProperties","track","unsetEventProperty"],c=0;c<p.length;c++)heap[p[c]]=o(p[c])};
          heap.load("1334277441");

/* Google Analytics */
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-80881338-1', 'auto');
ga('send', 'pageview');

// prices also in server in routes/index.js
var passPrices = {
  '3races': 195,
  '5races': 295,
  'unlimited': 695,
}

var passNames = {
  '3races': 'Contender',
  '5races': 'Athlete',
  'unlimited': 'Pro',
}

var passRaceCount = {
  '3races': 3,
  '5races': 5,
  'unlimited': 200,
}

distanceMap = {
  'Half Marathon': 21.09,
  'Marathon': 42.19,
  'Fun Run': 1,
}
function formatRaceDistance(dist) {
  Object.keys(distanceMap).forEach(function(name) {
    if (Math.abs(distanceMap[name] - dist) < 0.1) {
      return name;
    }
  });
  return dist + 'K';
}

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}

function pseudoRandom(race, o) {
  str = race.name + race.type;
  var hash = 0;
  if (str.length == 0) return hash;
  for (i = 0; i < str.length; i++) {
    char = str.charCodeAt(i);
    hash = hash * o + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return (hash / 1000 % 1)
}

function combinedSearch(queryText, callback) {
  var service = new google.maps.places.AutocompleteService();

  var request = {
    types: ['(regions)'],
    components: 'country:us',
    radius: 5000,
    query: queryText
  };
  if (window.map) {
    request['location'] = window.map.getCenter();
  }
  var combined = [];

  var returnedCount = 0;

  service.getPlacePredictions({
    input: queryText,
    types: ['(regions)'],
    componentRestrictions: {
      country: 'us'
    }
  }, function(data) {
    data = data || [];
    var places = data.map(function(r) {
      console.log(r)
      return {
        'type': 'place',
        'place_id': r.place_id,
        'name': r.description,
      };
    });
    combined = combined.concat(places);
    returnedCount++;
    if (returnedCount >= 2) {
      callback(combined);
    }
  });

  var query = {'$and': []}
  queryText.split(' ').forEach(function(word) {
    query['$and'].push({"name":{"$regex": word, "$options":"i"}})
  });
  $.getJSON(window.apiurl + 'race?limit=5&query=' + JSON.stringify(query))
    .then(function(data) {
      var races = data.map(function(r) {
        return {
          'type': 'race',
          'location': r.location.coordinates,
          'name': r.name,
          'race': r,
        };
      })
      combined = combined.concat(races);
      returnedCount++;
      if (returnedCount >= 2) {
        callback(combined);
      }
    });
}

function calculateAge(birthday) { // birthday is a date
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

window.apiurl = '//api.racepass.com/'
//window.apiurl = '//local.racepass.com:3000/'
