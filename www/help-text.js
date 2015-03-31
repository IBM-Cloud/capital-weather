// Licensed under the Apache License. See footer for details.

//------------------------------------------------------------------------------
function getHelpHTML() {
  var html = []

  html.push("<h3>capital weather</h3>")

  html.push("<p>Click on a weather icon to see detailed weather information")
  html.push("about that location.")
  html.push("Double-click elsewhere on the map to see the weather in")
  html.push("that location.")

  html.push("<p>This")
  html.push("<a target='_blank' href='https://bluemix.net'>Bluemix</a>")
  html.push("application uses data from")
  html.push("<a target='_blank' href='http://www.wsi.com/'>The Weather Company</a>")
  html.push("to display the weather in")
  html.push("capitals around the world, and US state capitals.")

  html.push("<p>For more information on the partnership between IBM and")
  html.push("The Weather Company, see the press release")
  html.push("<a target='_blank' href='http://www-03.ibm.com/press/us/en/pressrelease/46446.wss'>")
  html.push("IBM and The Weather Company Partner to Bring Advanced Weather Insights to Business")
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
