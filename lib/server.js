// Licensed under the Apache License. See footer for details.
var hapi  = require("hapi"),
    cfenv = require("cfenv"),
    weatherService = require("./weatherService");

var vcapLocal = null;
try { vcapLocal = require("../vcap-local.json"); } catch (e) {}

//------------------------------------------------------------------------------
process.on("exit", function(code) {
  console.log("exiting: code: " + code);
})

process.on("uncaughtException", function(err) {
  console.log("uncaught exception: " + err.stack);
  process.exit(1);
})

//------------------------------------------------------------------------------
var appEnvOpts = vcapLocal ? {vcap:vcapLocal} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts);

// Creates a new weather service
var wService = getWeatherService(appEnv);

var server = new hapi.Server();
server.connection({host: appEnv.bind, port: appEnv.port});

// Route calls to main page
server.route({
  method:  "GET",
  path:    "/{param*}",
  handler: { directory: { path: "www" } }
})

// Route API calls to retrieve current weather data
server.route({
  method:  "GET",
  path:    "/api/currentConditions",
  handler: api_currentConditions
})

// Route API calls to retrieve historical weather data
server.route({
  method:  "GET",
  path:    "/api/historicConditions",
  handler: api_historicConditions
})

// Route API calls to retrieve past date weather data
server.route({
  method:  "GET",
  path:    "/api/pastConditions",
  handler: api_pastConditions
})

// Route API calls to retrieve predictive weather data
server.route({
  method:  "GET",
  path:    "/api/predictConditions",
  handler: api_predictConditions
})

console.log("server starting on: " + appEnv.url)
server.start(function() {
  console.log("server started  on: " + appEnv.url)
})

//------------------------------------------------------------------------------
// Reqest Handler for getting current weather data
function api_currentConditions(request, reply) {
  var lat = request.query.latitude;
  var lon = request.query.longitude;

  console.log("Server.js - Getting current conditions @ " + lat + ", " + lon);
  wService.getCurrentConditions(lat, lon, function(result) {
    // If error, log error and return
    var resultJSON = JSON.parse(result);
    if (resultJSON.error) reply(result);
    // If success, extract important results and return data
    else {
      var currentConditions = {
        iconCode:         resultJSON.observation.icon_code,
        conditionPhrase:  resultJSON.observation.phrase_32char,
        temp:             resultJSON.observation.imperial.temp,
        windSpeed:        resultJSON.observation.imperial.wspd,
        uvIndex:          resultJSON.observation.uv_index,
        error:            false
      };

      var ccString = JSON.stringify(currentConditions);
      reply(ccString);
    }
  })
}

//------------------------------------------------------------------------------
// Reqest Handler for getting historical weather data
function api_historicConditions(request, reply) {
  var lat = request.query.latitude;
  var lon = request.query.longitude;

  console.log("Server.js - Getting historical conditions @ " + lat + ", " + lon);
  wService.getHistoricConditions(lat, lon, function(result) {
    if (result && result.length > 0) {
      // Loop through returned historical results
      var conditions = [],
          conditionDate,
          conditionYear,
          obs;
      for (var i=0; i < result.length; i++) {
        // If no results for year, skip result
        if (result[i].error) {
          continue;
        }

        // Check for null values
        obs = result[i].observations[0];
        if (!obs.valid_time_gmt) continue;
        if (!obs.temp) continue;
        if (!obs.wx_phrase) obs.wx_phrase = "Unknown";

        // Extract important info from the historical condition
        conditionDate = new Date(obs.valid_time_gmt * 1000);
        conditionYear = conditionDate.getYear() + 1900;
        conditions.push(JSON.stringify([conditionYear, obs.temp, obs.wx_phrase]));
      }
      reply(conditions);
    }
    else
      reply(null);
  })
}

//------------------------------------------------------------------------------
// Reqest Handler for getting past date's weather data
function api_pastConditions(request, reply) {
  var lat = request.query.latitude;
  var lon = request.query.longitude;
  var month = request.query.month;
  var day = request.query.day;
  var year = request.query.year;

  console.log("Server.js - Getting past conditions @ " + lat + ", " + lon);
  wService.getPastConditions(lat, lon, month, day, year, function(result) {
    // If error, log error and return
    var resultJSON = JSON.parse(result);
    if (resultJSON.error) reply(result);
    else {
      try {
        // Check for null values
        var obs = resultJSON.observations[0];
        if (!obs) throw null;
        if (!obs.temp) throw null;
        if (!obs.wx_phrase) obs.wx_phrase = "Unknown";

        // Extract important info from the historical condition
        var pastConditions = {
          temp:           obs.temp,
          conditionPhase: obs.wx_phrase,
          iconCode:       obs.wx_icon,
          error:          false
        };

        var pcString = JSON.stringify(pastConditions);
        reply(pcString);
      }
      catch (e) {
        reply(null);
      }
    }
  })
}

//------------------------------------------------------------------------------
// Reqest Handler for predicting future date's weather
function api_predictConditions(request, reply) {
  var lat = request.query.latitude;
  var lon = request.query.longitude;
  var month = request.query.month;
  var day = request.query.day;

  console.log("Server.js - Predicting future conditions @ " + lat + ", " + lon);
  wService.predictConditions(lat, lon, month, day, function(result) {
    // If error, log error and return
    var resultJSON = JSON.parse(result);
    if (resultJSON.error) reply(result);
    else reply(result);
  })
}

//------------------------------------------------------------------------------
// Ensures a weather service is found in VCAPS
// If found, returns a new weather service object
function getWeatherService(appEnv) {
  var serviceCreds = appEnv.getServiceCreds("weather-service")
  if (!serviceCreds) {
    console.log("service 'weather-service' not bound to this application")
    return
  }

  var url    = serviceCreds.url
  var apiKey = serviceCreds.apiKey

  if (!url) {
    console.log("service 'weather-service' does not have an 'url' property")
  }

  if (!apiKey) {
    console.log("service 'weather-service' does not have an 'apiKey' property")
  }

  if (apiKey && url) return new weatherService.create(url, apiKey)
}

//------------------------------------------------------------------------------
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------
