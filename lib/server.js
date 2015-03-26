// Licensed under the Apache License. See footer for details.

//------------------------------------------------------------------------------
// packages/modules we're using
//------------------------------------------------------------------------------

var hapi  = require("hapi")
var cfenv = require("cfenv")

var weatherService = require("./weatherService")

var vcapLocal = null
try { vcapLocal = require("../vcap-local.json") } catch (e) {}

//------------------------------------------------------------------------------
process.on("exit", function(code) {
  console.log("exiting: code: " + code)
})

process.on("uncaughtException", function(err) {
  console.log("uncaught exception: " + err.stack)
  process.exit(1)
})

//------------------------------------------------------------------------------
var appEnvOpts = vcapLocal ? {vcap:vcapLocal} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts)

var wService = getWeatherService(appEnv)

var server = new hapi.Server()

server.connection({host: appEnv.bind, port: appEnv.port})

server.route({
  method:  "GET",
  path:    "/{param*}",
  handler: { directory: { path: "www" } }
})

server.route({
  method:  "GET",
  path:    "/api/currentConditions/{lat},{lon}",
  handler: api_currentConditions
})

console.log("server starting on: " + appEnv.url)
server.start(function() {
  console.log("server started  on: " + appEnv.url)
})

//------------------------------------------------------------------------------
function api_currentConditions(request, reply) {
  var lat = request.params.lat
  var lon = request.params.lon

  wService.getCurrentConditions(lat, lon, function(err, result) {
    if (err) result = { error: "" + err }

    reply(result)
  })
}

//------------------------------------------------------------------------------
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
