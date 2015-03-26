// Licensed under the Apache License. See footer for details.

//------------------------------------------------------------------------------
// packages/modules we're using
//------------------------------------------------------------------------------

var hapi  = require("hapi")
var cfenv = require("cfenv")

//------------------------------------------------------------------------------
process.on("exit", function(code) {
  console.log("exiting: code: " + code)
})

process.on("uncaughtException", function(err) {
  console.log("uncaught exception: " + err.stack)
  process.exit(1)
})

//------------------------------------------------------------------------------
var appEnv = cfenv.getAppEnv()
var server = new hapi.Server()

server.connection({host: appEnv.bind, port: appEnv.port})

server.route({
  method:  "GET",
  path:    "/{param*}",
  handler: { directory: { path: "www" } }
})

server.route({ method: "GET", path: "/api/foo", handler: api_foo })

console.log("server starting on: " + appEnv.url)
server.start(function() {
  console.log("server started  on: " + appEnv.url)
})

//------------------------------------------------------------------------------
function api_foo(request, reply) {
  console.log("request for /api/foo")
  reply({})
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
