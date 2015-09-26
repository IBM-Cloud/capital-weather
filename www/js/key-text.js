// Licensed under the Apache License. See footer for details.

//------------------------------------------------------------------------------
function getKeyHTML() {
  var html = []

  html.push("<h3>Icon Key</h3>")

  html.push("<table>")
  html.push("<tr><td class='key-icon'><i class='wi wi-day-sunny wi-size-s wi-popup'></i><td class='td-indent'>Sunny<td class='key-icon td-indent'><i class='wi wi-snow wi-size-s wi-popup'></i><td class='td-indent'>Snow")
  html.push("<tr><td class='key-icon'><i class='wi wi-cloudy wi-size-s wi-popup'></i><td class='td-indent'>Cloudy<td class='key-icon td-indent'><i class='wi wi-hail wi-size-s wi-popup'></i><td class='td-indent'>Hail")
  html.push("<tr><td class='key-icon'><i class='wi wi-sprinkle wi-size-s wi-popup'></i><td class='td-indent'>Light Rain<td class='key-icon td-indent'><i class='wi wi-sleet wi-size-s wi-popup'></i><td class='td-indent'>Sleet")
  html.push("<tr><td class='key-icon'><i class='wi wi-rain wi-size-s wi-popup'></i><td class='td-indent'>Rain Showers<td class='key-icon td-indent'><i class='wi wi-dust wi-size-s wi-popup'></i><td class='td-indent'>Dusty")
  html.push("<tr><td class='key-icon'><i class='wi wi-thunderstorm wi-size-s wi-popup'></i><td class='td-indent'>Thunderstorm<td class='key-icon td-indent'><i class='wi wi-fog wi-size-s wi-popup'></i><td class='td-indent'>Foggy")
  html.push("<tr><td class='key-icon'><i class='wi wi-lightning wi-size-s wi-popup'></i><td class='td-indent'>Lightning<td class='key-icon td-indent'><i class='wi wi-smoke wi-size-s wi-popup'></i><td class='td-indent'>Smoky")
  html.push("</table>")

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
