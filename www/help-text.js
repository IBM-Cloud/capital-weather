// Licensed under the Apache License. See footer for details.

//------------------------------------------------------------------------------
function getHelpHTML() {
  var html = []

  html.push("<h1>capital weather</h1>")
  html.push("<p>This application displays the weather in")
  html.push("capitals around the world, and US state capitals.")
  html.push("<p>Double-click on the map to see the weather in the")
  html.push("new location.")
  html.push("<p>The source for this application is available at")
  html.push("<a href='https://github.com/IBM-Bluemix/capital-weather' target='_blank'>")
  html.push("github.com/IBM-Bluemix/capital-weather")
  html.push("</a>")
  html.push("<p><a href='https://bluemix.net/deploy?repository=https://github.com/IBM-Bluemix/capital-weather.git' target='_blank'>")
  html.push("<img src='http://bluemix.net/deploy/button.png' alt='Bluemix button' />")
  html.push("</a>")

  return html.join("\n")
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
