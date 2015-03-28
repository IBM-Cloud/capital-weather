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
var CacheHistoricCond = lruCache({max: 2000, maxAge: 1000 * 60 * 60 * 24 * 365})

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
  // CHANGE BACK TO 10 YEARS BEFORE COMITTING!!!!!!!!!!
  for (var i=1; i<6; i++) {
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
    console.log(results) //----------
    cb(err, results)
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
    if (err === null)
    {
      var result   = JSON.parse(result)

      // Results were returned for query
      if (result.observations)
      {
        var midIndex = Math.floor(result.observations.length / 2)

        result.observations = [ result.observations[midIndex] ]
        result = JSON.stringify(result)

        CacheHistoricCond.set(cacheKey, result)
      }
      // No data returned for query
      else if (result.errors[0].error.code === "NDF-0001")
      {
        console.log("No results were found for " + date);
        result = JSON.stringify(result)
      }
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
