// Licensed under the Apache License. See footer for details.

var path = require("path")

var request  = require("request")
var lruCache = require("lru-cache")
var sampleCC = require("./sample-data/current-conditions")

//------------------------------------------------------------------------------
exports.create = createService

var CacheCurrentCond = lruCache({max: 500, maxAge: 1000 * 60 * 60})

//------------------------------------------------------------------------------
function createService(url, apiKey) {
  return new Service(url, apiKey)
}

//------------------------------------------------------------------------------
function Service(url, apiKey) {
  this.url    = url
  this.apiKey = apiKey
}

Service.prototype.getCurrentConditions = Service__getCurrentConditions

//------------------------------------------------------------------------------
function Service__getCurrentConditions(lat, lon, cb) {
  var cacheKey = lat + "," + lon

  var result = CacheCurrentCond.get(cacheKey)
  if (result) return cb(null, result)

  var url = this.url + "/v1/geocode/" +
        lat + "/" + lon + "/" +
        "/observations/current.json"

  var requestOpts = {
    url: url,
    qs: {
      apiKey:   this.apiKey,
      language: "en-US",
      units:    "e"
    }
  }

  request(requestOpts, function(err, message, body) {
    result = body

    CacheCurrentCond.set(cacheKey, result)

    cb(null, result)
  })
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
