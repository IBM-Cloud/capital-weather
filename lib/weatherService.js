// Licensed under the Apache License. See footer for details.

var path = require("path")

var async    = require("async")
var request  = require("request")
var lruCache = require("lru-cache")

var sampleCC = require("./sample-data/current-conditions")

//------------------------------------------------------------------------------
exports.create = createService

// Creates caches for the current (1 hour) and historical (1 year) weather data
var CacheCurrentCond  = lruCache({max: 500,  maxAge: 1000 * 60 * 60})
var CacheHistoricCond = lruCache({max: 3000, maxAge: 1000 * 60 * 60 * 24 * 365})

//------------------------------------------------------------------------------
function createService(url, apiKey) {
  return new Service(url, apiKey)
}

//------------------------------------------------------------------------------
function Service(url, apiKey) {
  this.url    = url
  this.apiKey = apiKey
}

Service.prototype.getCurrentConditions  = Service__getCurrentConditions
Service.prototype.getHistoricConditions = Service__getHistoricConditions
Service.prototype.getPastConditions = Service_getPastConditions
Service.prototype.predictConditions = Service_predictConditions

//------------------------------------------------------------------------------
// Gets weather data for lat/lon on current date
function Service__getCurrentConditions(lat, lon, cb) {
  // Gets cached version of current weather if present
  var cacheKey = lat + "," + lon
  var result = CacheCurrentCond.get(cacheKey)
  if (result) return cb(null, result)

  // Builds REST URL for requesting current weather
  var url = this.url + "/v1/geocode/" +
        lat + "/" + lon +
        "/observations/current.json"

  var requestOpts = {
    url: url,
    qs: {
      apiKey:   this.apiKey,
      language: "en-US",
      units:    "e"
    }
  }

  // Caches and returns current weather data for input lat/lon
  request(requestOpts, function(err, message, result) {
    if (err !== null && err != undefined)
      CacheCurrentCond.set(cacheKey, result)
    cb(null, result)
  })
}

//------------------------------------------------------------------------------
// Gets weather data for lat/lon on past 10 years on current date
function Service__getHistoricConditions(lat, lon, cb) {
  var dates = []
  var date = new Date()
  var year = date.getYear()  + 1900
  var mon  = date.getMonth() + 1
  var day  = date.getDate()

  // Adjusts date if Feb 28
  if ((mon == 2) && (day == 29)) day = 28

  // Adds dates from past 10 years to dates[] array
  for (var i=1; i<11; i++) {
    var hDate = "" + (year-i) + "" + right(mon,0,2) + "" + right(day,0,2)
    dates.push(hDate)
  }

  var url    = this.url
  var apiKey = this.apiKey

  var dateReqs = dates.map(function(date, i) {
    return function(cb) { getOneHC(url, apiKey, lat, lon, dates[i], cb) }
  })
  // Makes all REST calls for historical weather data in parallel
  async.parallel(dateReqs, function(err, results) {
    results = results.map(function(result) {
      return JSON.parse(result)
    })

    cb(null, results)
  })
}

//------------------------------------------------------------------------------
// Gets weather data for lat/lon on input date
function Service_getPastConditions(lat, lon, month, day, year, cb) {

  // Adjusts date if Feb 28
  if ((month == 2) && (day == 29)) day = 28

  // Create date string from input parameters
  date = "" + (year) + "" + right(month,0,2) + "" + right(day,0,2)

  var url    = this.url
  var apiKey = this.apiKey

  getOneHC(url, apiKey, lat, lon, date, function(err, result) {
    result = JSON.parse(result)
    cb(err, result)
  })
}

//------------------------------------------------------------------------------
// Predict weather data for a future date
function Service_predictConditions(lat, lon, month, day, cb) {
  var dates = []
  var date = new Date()
  var year = date.getYear()  + 1900

  // Adjusts date if Feb 28
  if ((month == 2) && (day == 29)) day = 28

  // Adds dates from past 25 years to dates[] array
  for (var i=1; i<26; i++) {
    var hDate = "" + (year-i) + "" + right(month,0,2) + "" + right(day,0,2)
    dates.push(hDate)
  }

  var url    = this.url
  var apiKey = this.apiKey

  var dateReqs = dates.map(function(date, i) {
    return function(cb) { getOneHC(url, apiKey, lat, lon, dates[i], cb) }
  })

  // Makes all REST calls for historical weather data in parallel
  async.parallel(dateReqs, function(err, results) {
    results = results.map(function(result) {
      return JSON.parse(result)
    })
    var temps = [],
      conditionStrings = [],
      conditions = new Map(),
      startYear,
      endYear,
      tempResult;

    // Get temp, year, and conditions of all returned observations
    for (var i=0; i < results.length; i++)
    {
      tempResult = results[i]

      if (tempResult.observations)
      {
        // Push result temperature
        if (tempResult.observations[0].temp)
        temps.push(tempResult.observations[0].temp)

        // Push result year
        var date = new Date(tempResult.observations[0].valid_time_gmt * 1000)
        var year = date.getYear() + 1900
        if (!startYear || year < startYear)
          startYear = year;
        if (!endYear || year > endYear)
          endYear = year;

        // Push condition
        cond = tempResult.observations[0].wx_phrase;
        if (cond)
        {
          var condInMap = conditions.has(cond)

          // If condition already in map, add 1 to associated value
          // Otherwise, place in map with initial value of 1
          if (condInMap)
          {
            var count = conditions.get(cond)
            count++
            conditions.set(cond, count)
          }
          else
          {
            conditions.set(cond, 1)
            conditions.set(cond + "-icon", tempResult.observations[0].wx_icon)
            conditionStrings.push(cond)
          }
        }
      }
    }

    // Get the average temperature from the list
    var status;
    if (temps.length > 0)
    {
      var tempAvg = 0,
          status = "success"
      for (var i=0; i < temps.length; i++)
      {
        tempAvg += temps[i];
      }
      tempAvg = (tempAvg/temps.length).toFixed(2);
    }
    else
      status = "failure"


    // Get the most frequently occuring condition
    if (conditionStrings.length > 0)
    {
      var maxCond = 0,
          mostFreqCond;
      for (var i=0; i < conditionStrings.length; i++)
      {
        var condVal = conditions.get(conditionStrings[i])
        if (condVal > maxCond)
        {
          mostFreqCond = conditionStrings[i];
          maxCond = condVal;
        }
      }
      var iconCode = conditions.get(mostFreqCond + "-icon")
    }

    var predictedWeather = {
      avgTemp : tempAvg,
      startYear : startYear,
      endYear : endYear,
      frequentCondition : mostFreqCond,
      iconCode: iconCode,
      status : status
    };

    cb(err, predictedWeather)
  })
}

//------------------------------------------------------------------------------
// Gets weather for lat/lon on a single historical date
function getOneHC(url, apiKey, lat, lon, date, cb) {
  // Gets cached version of historical weather if present
  var cacheKey = lat + "," + lon + "," + date
  var result = CacheHistoricCond.get(cacheKey)
  if (result) return cb(null, result)

  // Builds REST URL for requesting historical weather
  var url = url + "/v1/geocode/" +
        lat + "/" + lon +
        "/observations/historical.json"

  var requestOpts = {
    url: url,
    qs: {
      apiKey:   apiKey,
      language: "en-US",
      units:    "e",
      startDate: date, // 201406153
    }
  }

  // Caches and returns historical weather data for input lat/lon
  request(requestOpts, function(err, message, result) {
    if (err) {
      err    = null
      result = "{}"
    }

    result = JSON.parse(result)

    // Results were returned for query
    if (result.observations) {
      var midIndex = Math.floor(result.observations.length / 2)

      result.observations = [ result.observations[midIndex] ]
      result = JSON.stringify(result)

      CacheHistoricCond.set(cacheKey, result)
    }

    // No data returned for query
    else {
      result = JSON.stringify(result)
    }

    cb(null, result)
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
