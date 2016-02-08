// Licensed under the Apache License. See footer for details.
var path = require("path"),
    async    = require("async"),
    request  = require("request"),
    lruCache = require("lru-cache");

//------------------------------------------------------------------------------
exports.createFull = createFullService;
exports.createBasic = createBasicService;

// Creates caches for the current (1 hour) and historical (1 year) weather data
var CacheCurrentCond  = lruCache({max: 500,  maxAge: 1000 * 60 * 60});
var CacheHistoricCond = lruCache({max: 3000, maxAge: 1000 * 60 * 60 * 24 * 365});

//------------------------------------------------------------------------------
function createFullService(url, apiKey) {
  return new Service(url, true, apiKey);
}

function createBasicService(url, port) {
  return new Service(url, false, port);
}

//------------------------------------------------------------------------------
function Service(url, full, val) {
  if (full) {
    this.full = true;
    this.url    = url;
    this.apiKey = val;
  }
  else {
    this.full = false;
    this.insightsUrl    = url + ":" + val + "/api/weather";
    this.version = "/v2";
    this.observations = "/observations";
    this.language = "en-US";
  }
}

Service.prototype.getCurrentConditions  = Service__getCurrentConditions;
Service.prototype.getHistoricConditions = Service__getHistoricConditions;
Service.prototype.getPastConditions = Service_getPastConditions;
Service.prototype.predictConditions = Service_predictConditions;
Service.prototype.getOneHC = Service__getOneHC;

//------------------------------------------------------------------------------
// Gets weather data for lat/lon on current date
function Service__getCurrentConditions(lat, lon, cb) {
  // Gets cached version of current weather if present
  var cacheKey = lat + "," + lon;
  var result = CacheCurrentCond.get(cacheKey);
  if (result) return cb(result);

  // Builds REST URL for requesting current weather
  var url, requestOpts;
  if (this.full) {
    console.log("Getting current conditions from TWC");
    url = this.url + "/v1/geocode/" +
          lat + "/" + lon +
          "/observations/current.json";

    requestOpts = {
      url: url,
      qs: {
        apiKey:   this.apiKey,
        language: "en-US",
        units:    "e"
      }
    };
  }
  else {
    console.log("Getting current conditions from Weather Insights");
    url = this.insightsUrl + this.version + this.observations + "/current";

    requestOpts = {
      url: url,
      qs: {
        units:   "e",
        geocode: lat + "," + lon,
        language:    "en-US"
      }
    };
  }

  // Caches and returns current weather data for input lat/lon
  request(requestOpts, function(err, message, result) {
    var result = checkError(result);
    if (!JSON.parse(result).error)
      CacheCurrentCond.set(cacheKey, result);
    cb(result)
  })
}

//------------------------------------------------------------------------------
// Gets weather data for lat/lon on past 10 years on current date
function Service__getHistoricConditions(lat, lon, cb) {
  var dates = [];
  var date = new Date();
  var year = date.getYear() + 1900;
  var month  = date.getMonth() + 1;
  var day = adjustDayForLeapYear(month, date.getDate());

  // Adds dates from past 10 years to dates[] array
  for (var i=1; i<11; i++) {
    var hDate = "" + (year-i) + "" + right(month,0,2) + "" + right(day,0,2);
    dates.push(hDate);
  }

  var url    = this.url;
  var apiKey = this.apiKey;

  var dateReqs = dates.map(function(date, i) {
    return function(cb) { Service__getOneHC(url, apiKey, lat, lon, dates[i], cb); };
  });
  // Makes all REST calls for historical weather data in parallel
  async.parallel(dateReqs, function(err,results) {
    results = results.map(function(result) {
      return JSON.parse(result);
    });
    cb(results);
  })
}

//------------------------------------------------------------------------------
// Gets weather data for lat/lon on input date
function Service_getPastConditions(lat, lon, month, day, year, cb) {

  // Create date string from input parameters
  day = adjustDayForLeapYear(month, day);
  date = "" + (year) + "" + right(month,0,2) + "" + right(day,0,2);

  var url    = this.url;
  var apiKey = this.apiKey;

  Service__getOneHC(url, apiKey, lat, lon, date, function(err,result) {
    cb(result)
  })
}

//------------------------------------------------------------------------------
// Predict weather data for a future date
function Service_predictConditions(lat, lon, month, day, cb) {
  var dates = [];
  var date = new Date();
  var year = date.getYear()  + 1900;
  day = adjustDayForLeapYear(month, day);

  // Adds dates from past 25 years to dates[] array
  for (var i=1; i<26; i++) {
    var hDate = "" + (year-i) + "" + right(month,0,2) + "" + right(day,0,2);
    dates.push(hDate);
  }

  var url    = this.url;
  var apiKey = this.apiKey;

  var dateReqs = dates.map(function(date, i) {
    return function(cb) { Service__getOneHC(url, apiKey, lat, lon, dates[i], cb); };
  });

  // Makes all REST calls for historical weather data in parallel
  async.parallel(dateReqs, function(err,results) {
    results = results.map(function(result) {
      return JSON.parse(result);
    })
      var temps = [],
      conditionStrings = [],
      conditions = new Map(),
      noData = false,
      startYear,
      endYear,
      tempResult,
      obs;

    // Get temp, year, and conditions of all returned observations
    for (var i=0; i < results.length; i++) {
      tempResult = results[i];

      if (tempResult.error) {
        if (tempResult.errors[0].error.code === "NDF-0001")
          noData = true;
        continue;
      }
      // Push result temperature
      obs = tempResult.observations[0];
      if (obs.temp)
        temps.push(obs.temp);

      // Push result year
      var date = new Date(obs.valid_time_gmt * 1000);
      var year = date.getYear() + 1900;
      if (!startYear || year < startYear)
        startYear = year;
      if (!endYear || year > endYear)
        endYear = year;

      // Push condition
      cond = obs.wx_phrase;
      if (cond) {
        var condInMap = conditions.has(cond);

        // If condition already in map, add 1 to associated value
        // Otherwise, place in map with initial value of 1
        if (condInMap) {
          var count = conditions.get(cond);
          count++;
          conditions.set(cond, count);
        }
        else {
          conditions.set(cond, 1);
          conditions.set(cond + "-icon", obs.wx_icon);
          conditionStrings.push(cond);
        }
      }
    }

    // Get the most frequently occuring condition
    if (conditionStrings.length > 0) {
      var maxCond = 0,
          mostFreqCond;
      for (var i=0; i < conditionStrings.length; i++) {
        var condVal = conditions.get(conditionStrings[i])
        if (condVal > maxCond) {
          mostFreqCond = conditionStrings[i];
          maxCond = condVal;
        }
      }
      var iconCode = conditions.get(mostFreqCond + "-icon")
    }

    // Get the average temperature from the list
    var status;
    if (temps.length > 0) {
      var tempAvg = 0,
          success = true;
      for (var i=0; i < temps.length; i++) {
        tempAvg += temps[i];
      }
      tempAvg = (tempAvg/temps.length).toFixed(2);
    }
    else
      success = false;

    var predictedWeather = {
      avgTemp:           tempAvg,
      startYear:         startYear,
      endYear:           endYear,
      frequentCondition: mostFreqCond,
      iconCode:          iconCode,
      success:           success,
      noData:            noData
    };


    cb(JSON.stringify(predictedWeather));
  })
}

//------------------------------------------------------------------------------
// Gets weather for lat/lon on a single historical date
function Service__getOneHC(url, apiKey, lat, lon, date, cb) {
  // Gets cached version of historical weather if present
  var cacheKey = lat + "," + lon + "," + date;
  var result = CacheHistoricCond.get(cacheKey);
  if (result) return cb(null,result);

  // Builds REST URL for requesting historical weather
  var url = url + "/v1/geocode/" +
        lat + "/" + lon +
        "/observations/historical.json";

  var requestOpts = {
    url: url,
    qs: {
      apiKey:   apiKey,
      language: "en-US",
      units:    "e",
      startDate: date // 201406153
    }
  }

  // Caches and returns historical weather data for input lat/lon
  request(requestOpts, function(err, message, result) {
    var result = checkError(result);
    var resultJSON = JSON.parse(result);
    if (!resultJSON.error) {
      // Ensure observations are available, otherwise mark an error
      if (resultJSON.observations.length > 0) {
        // Get midday recording and replace array with this observation
        var midIndex = Math.floor(resultJSON.observations.length / 2);
        resultJSON.observations = [ resultJSON.observations[midIndex] ];
      }
      else
        resultJSON.error = true;
      result = JSON.stringify(resultJSON);
      CacheHistoricCond.set(cacheKey, result);
    }
    cb(null,result);
  })
}

//------------------------------------------------------------------------------
function right(s, pad, len) {
  s   = "" + s
  pad = "" + pad

  while (s.length < len) s = pad + s

  return s
}

//------------------------------------------------------------------------------
// Checks if the API response contains an error and adds an error parameter
// Also logs to error stream
function checkError(result) {
  var resultJSON = JSON.parse(result);
  var errors = resultJSON.errors;
  if (errors !== null && errors !== undefined) {
    // Create log entries for each returned error
    if (errors.length > 0) {
      for (var i=0; i < errors.length; i++) {
        console.error("(" + errors[i].error.code + "): " + errors[i].error.message);
      }
    }
    resultJSON.error = true;
    return JSON.stringify(resultJSON);
  }
  else {
    resultJSON.error = false;
    return JSON.stringify(resultJSON);
  }
}

//------------------------------------------------------------------------------
// Adjusts date if Feb 28
function adjustDayForLeapYear(month, day) {
  return ((month == 2) && (day == 29)) ? 28 : day;
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
