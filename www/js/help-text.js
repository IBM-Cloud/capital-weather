// Licensed under the Apache License. See footer for details.

//------------------------------------------------------------------------------
function getHelpHTML() {
  var html = []

  html.push("<h3>Capital Weather</h3>")

  html.push("<p>This application displays the weather in all world capitals.")

  html.push("<p><strong>Click</strong> on a weather icon to see detailed weather info")
  html.push("for that location in both the past and present.")

  html.push("<p><strong>Double click</strong> on any other location on the map")
  html.push("to get the weather data for the corresponding city.")

  html.push("<p><strong>Note the links below are not yet fully operational.</strong>")

  html.push("<p>This application uses the")
  html.push("<a href='https://ibm.biz/capital-weather-demo-bluemix' target='_blank'>Bluemix</a>")
  html.push("<a href='https://console.ng.bluemix.net/catalog/services/insights-for-weather/' target='_blank'>Insights for Weather service</a> to obtain weather information.")
  html.push("See the")
  html.push("<a href='https://www.ng.bluemix.net/docs/services/Weather/index.html' target='_blank'> service documentation</a>")
  html.push("for more information about using this service in your Bluemix application.")

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
