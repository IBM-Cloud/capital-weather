// Licensed under the Apache License. See footer for details.

//------------------------------------------------------------------------------
// leaflet - the "L" things:
//   http://leafletjs.com/reference.html
//
// esri-leaflet - the "L.esri" things
//   http://esri.github.io/esri-leaflet/api-reference/
//------------------------------------------------------------------------------

var Map
var Help

$(onLoad)

// Get capital cities from locations.js file
// If on local, only use 1st city for debugging
Locations = getLocations()
if (location.hostname == "localhost") {
  Locations = Locations.slice(0,10)
}

//------------------------------------------------------------------------------
function onLoad() {
  Map = L.map("map", {
    doubleClickZoom: false
  })

  // add markers to all locations
  Locations.forEach(function(location){
    getCurrentConditions(location)

    var marker = L.marker(location, {
      title:   location.name,
      alt:     location.name,
      opacity: 0
    })

    location.marker = marker
    marker.addTo(Map)
  })

  // add layer control
  var ngLayer = L.esri.basemapLayer("NationalGeographic")
  ngLayer.addTo(Map)

  var baseMaps = {
    Streets:            L.esri.basemapLayer("Streets"),
    Topographic:        L.esri.basemapLayer("Topographic"),
    NationalGeographic: ngLayer,
    Oceans:             L.esri.basemapLayer("Oceans"),
    Gray:               L.esri.basemapLayer("Gray"),
    DarkGray:           L.esri.basemapLayer("DarkGray"),
    Imagery:            L.esri.basemapLayer("Imagery"),
    ShadedRelief:       L.esri.basemapLayer("ShadedRelief"),
  }

  L.control.layers(baseMaps).addTo(Map)

  // add help info box
  var info = L.control({position: "bottomleft"})

  Help = L.popup()
    .setContent(getHelpHTML())

  info.onAdd = function (map) {
    var div = L.DomUtil.create("div")

    div.innerHTML = "<button id='help-button' type='button' class='btn btn-default'>Help</button>"

    $(document).on( "click", "#help-button", function() {
      displayHelp()
    })

    return div
  }

  info.addTo(Map)

//  if (!localStorage.firstTime) {
//    localStorage.firstTime = false

    setTimeout(displayHelp, 1000)
//  }

  // Gets the current weather conditions on the location clicked
  Map.on("dblclick", function(e) {
    var location = {
      lat:  e.latlng.lat,
      lon:  e.latlng.lng,
      name: e.latlng.lat.toFixed(4) + ", " + e.latlng.lng.toFixed(4)
    }

    var marker = L.marker(location, {
      title:   location.name,
      alt:     location.name,
      opacity: 0
    })

    location.marker = marker
    marker.addTo(Map)

    getCurrentConditions(location)
  })

  // fit map to initial bounds
  var bounds = [
    { lat: 44.32, lon:  -69.76 }, // maine
    { lat: 38.55, lon: -121.46 }, // california
  ]
  Map.fitBounds(bounds, {padding:[0,0]})
}

//------------------------------------------------------------------------------
// Displays the help text box in the center of the web page
function displayHelp(location) {
  Help
    .setLatLng(Map.getCenter())
    .openOn(Map)
}

//------------------------------------------------------------------------------
// Retrieves the current weather conditions from Jetstream
function getCurrentConditions(location) {
  var lat = location.lat
  var lon = location.lon

  $.ajax("/api/currentConditions/" + lat + "," + lon, {
    dataType: "json",
    success: function(data, status, jqXhr) {
      gotCurrentConditions(location, data, status, jqXhr)
    }
  })
}

//------------------------------------------------------------------------------
// Called after successfully retrieving the current weather conditions
function gotCurrentConditions(location, data, status, jqXhr) {
  var observation = data.observation
  if (null == observation) return

  var icon_code = observation.icon_code
  var icon = code2icon(icon_code)

  var desc = observation.phrase_32char
  var temp = "???"
  var wspd = "???"

  if (observation.imperial) {
    temp = observation.imperial.temp + "&deg; F"
    wspd = observation.imperial.wspd + " mph"
  }

  var uv_index  = observation.uv_index
  var uv_phrase = UV_desc[uv_index] || "???"

  var loc = JSON.stringify({
    lat:  location.lat,
    lon:  location.lon,
    name: location.name
  })

  var onClick = "javascript:getHistoricConditions(" + loc + ")"
  var table = [
    "<table>",
      "<tr><td>Conditions:  <td class='td-indent'>" + desc,
      "<tr><td>Temperature: <td class='td-indent'>" + temp,
      "<tr><td>Wind Speed:  <td class='td-indent'>" + wspd,
      "<tr><td>UV Index:    <td class='td-indent'>" + uv_phrase,
    "</table>",
    "<p><button class='button' onclick='" + onClick + "'>Display Historical Data</a>"
  ].join("\n")

  var icon = L.divIcon({
    html:      "<i class='wi " + icon + "'></i>",
    iconSize:  [64,64],
    className: "location-icon"
  })

  var popupText = "<h4>" + location.name + "</h4><p>" + table

  var marker = location.marker
  marker.setIcon(icon)
  marker.bindPopup(popupText)
  marker.setOpacity(1)
}

//------------------------------------------------------------------------------
function getHistoricConditions(location) {
  var lat = location.lat
  var lon = location.lon

  L.popup()
    .setContent("Getting historical data... <br><center><img src='spiffygif_30x30.gif'><center>")
    .setLatLng(location)
    .openOn(Map)

  $.ajax("/api/historicConditions/" + lat + "," + lon, {
    dataType: "json",
    success: function(data, status, jqXhr) {
      gotHistoricConditions(location, data, status, jqXhr)
    },
    error: function() {
      L.popup()
        .setContent("Error getting historical data, sorry!")
        .setLatLng(location)
        .openOn(Map)
    }
  })
}

//------------------------------------------------------------------------------
// Take returned historic conditions and parse them for display
function gotHistoricConditions(location, data, status, jqXhr) {
  try {
    gotHistoricConditions_(location, data, status, jqXhr)
  }
  // If no historical results were available or error parsing, print message on pop-up
  catch(e) {
    var errMsg;
    if (typeof e === 'string')
      errMsg = e;
    else
      errMsg = "Error getting historical data, sorry!"
    L.popup()
      .setContent(errMsg)
      .setLatLng(location)
      .openOn(Map)
    }
}

//------------------------------------------------------------------------------
function gotHistoricConditions_(location, data, status, jqXhr) {
  var history = []
  var noDataAvailable = 0;

  // Loop through the returned historical data sets for each year
  for (var i=0; i<data.length; i++) {
    // If there was no data available for this date, add to count
    if (data[i].errors)
    {
      noDataAvailable++;
      continue;
    }
    var obs = data[i].observations[0]
    if (null == obs) continue
    if (null == obs.valid_time_gmt) continue
    if (null == obs.temp) continue
    if (null == obs.wx_phrase) obs.wx_phrase = "Unknown"

    var date = new Date(obs.valid_time_gmt * 1000)
    var year = date.getYear() + 1900

    history.push([year, obs.temp, obs.wx_phrase])
  }

  // If no historical data was available, throw error
  // Otherwise, configure the pop-up window to display the data
  if (noDataAvailable === data.length)
    throw "No historical data available, sorry!"
  else
    showHistory(location, history)
}

//------------------------------------------------------------------------------
function showHistory(location, history) {
  Map.closePopup()

  var table = [
    "<table>",
      "<tr><td><strong>Year</strong> <td class='td-indent'><strong>Temp</strong> <td class='td-indent'><strong>Conditions</strong>",
  ]

  history.forEach(function(data){
    var year  = data[0]
    var temp  = data[1] + "&deg; F"
    var cond  = data[2]
    var entry = "<tr><td>" + year +
                "<td class='td-indent'>" + temp +
                "<td class='td-indent'>" + cond

    table.push(entry)
  })

  table.push("</table>")

  table = table.join("\n")

  var desc = "<p>Conditions on this day in previous years:"
  var popupHTML = "<h4>" + location.name + "</h4>" + desc + "<p>" + table

  L.popup()
    .setContent(popupHTML)
    .setLatLng(location)
    .openOn(Map)
}

//------------------------------------------------------------------------------
var UV_desc = {
  0:  "Low",
  1:  "Low",
  2:  "Low",
  3:  "Moderate",
  4:  "Moderate",
  5:  "Moderate",
  6:  "High",
  7:  "High",
  8:  "Very High",
  9:  "Very High",
  10: "Very High",
  11: "Extreme",
  12: "Extreme",
  13: "Extreme",
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
