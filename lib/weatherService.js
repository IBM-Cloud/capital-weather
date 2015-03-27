// Licensed under the Apache License. See footer for details.

var path = require("path")

var async    = require("async")
var request  = require("request")
var lruCache = require("lru-cache")

var sampleCC = require("./sample-data/current-conditions")

//------------------------------------------------------------------------------
exports.create = createService

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
function Service__getCurrentConditions(lat, lon, cb) {
  var cacheKey = lat + "," + lon

  var result = CacheCurrentCond.get(cacheKey)
  if (result) return cb(null, result)

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

  request(requestOpts, function(err, message, result) {
    CacheCurrentCond.set(cacheKey, result)

    cb(null, result)
  })
}

//------------------------------------------------------------------------------
function Service__getHistoricConditions(lat, lon, cb) {
  var dates = []
  var date = new Date()
  var year = date.getYear()  + 1900
  var mon  = date.getMonth() + 1
  var day  = date.getDate()

  if ((mon == 2) && (day == 29)) day = 28

  for (var i=1; i<11; i++) {
    var hDate = "" + (year-i) + "" + right(mon,0,2) + "" + right(day,0,2)
    dates.push(hDate)
  }

  var url    = this.url
  var apiKey = this.apiKey

  var dateReqs = dates.map(function(date, i) {
    return function(cb) { getOneHC(url, apiKey, lat, lon, dates[i], cb) }
  })

  async.parallel(dateReqs, function(err, results) {
    results = results.map(function(result) {
      return JSON.parse(result)
    })

    cb(err, results)
  })
}

//------------------------------------------------------------------------------
function getOneHC(url, apiKey, lat, lon, date, cb) {
  var cacheKey = lat + "," + lon + "," + date

  var result = CacheHistoricCond.get(cacheKey)
  if (result) return cb(null, result)

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

  request(requestOpts, function(err, message, result) {
    var result   = JSON.parse(result)
    var midIndex = result.observations.length / 2

    result.observations = [ result.observations[midIndex] ]
    result = JSON.stringify(result)

    CacheHistoricCond.set(cacheKey, result)

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
