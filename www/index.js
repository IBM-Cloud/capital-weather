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
      opacity: 1
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
      opacity: 1
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
    temp = getTempString(observation.imperial.temp)
    wspd = getSpeedString(observation.imperial.wspd)
  }

  var uv_index  = observation.uv_index
  var uv_phrase = UV_desc[uv_index] || "???"

  var loc = JSON.stringify({
    lat:  location.lat,
    lon:  location.lon,
    name: location.name
  })

  var onHistoryClick = "javascript:getHistoricConditions(" + loc + ")"
  var onPastDateClick = "javascript:enterDate(" + loc + ", false)"
  var onFutureDateClick = "javascript:enterDate(" + loc + ", true)"
  var table = [
    "<table>",
      "<tr><td>Conditions:  <td class='td-indent'>" + desc,
      "<tr><td>Temperature: <td class='td-indent'>" + temp,
      "<tr><td>Wind Speed:  <td class='td-indent'>" + wspd,
      "<tr><td>UV Index:    <td class='td-indent'>" + uv_phrase,
    "</table>"
  ].join("\n")

  var buttons = [
    "<p><button class='button' onclick='" + onHistoryClick + "'>Display Historical Data</button></p>",
    "<p><button class='button' onclick='" + onPastDateClick + "'>Get Past Day's Weather</button></p>",
    "<p><button class='button' onclick='" + onFutureDateClick + "'>Predict Future Day's Weather</button></p>"
  ].join("\n")

  var icon = L.divIcon({
    html:      "<i class='wi " + icon + "'></i>",
    iconSize:  [64,64],
    className: "location-icon"
  })

  var popupText = "<h4>" + location.name + "</h4><p>" + table + buttons

  var marker = location.marker
  marker.setIcon(icon)
  marker.bindPopup(popupText)
  marker.setOpacity(1)
}

//------------------------------------------------------------------------------
function getTempString(tempF) {
  tempF = parseInt(tempF, 10)
  if (isNaN(tempF)) return "???"

  var tempC = Math.round((tempF - 32) * 5 / 9)

  return "" + tempC + "&deg; C / " + tempF + "&deg; F"
}

//------------------------------------------------------------------------------
function getSpeedString(mph) {
  mph = parseInt(mph, 10)
  if (isNaN(mph)) return "???"

  var kph = Math.round(mph * 1.6)

  return "" + kph + " kph / " + mph + " mph"
}

//------------------------------------------------------------------------------
// Instructs the user to enter a date so they can get past/future weather data
function enterDate(location, getFuture) {
  var loc = JSON.stringify({
    lat:  location.lat,
    lon:  location.lon,
    name: location.name
  })

  var curDate = new Date(),
      curYear = curDate.getYear() + 1900,
      curMonth = curDate.getMonth() + 1,
      curDay = curDate.getDate();

  // Sets the pop up text based on if getting past or future date
  var instructions, minMonth, maxMonth, minDay, maxDay, minYear, maxYear, onDateClick, buttonText;
  if (getFuture)
  {
    instructions = "Input a future date to predict the weather"
    minMonth = 1
    maxMonth = 12
    minDay = 1
    maxDay = 31
    minYear = curYear
    maxYear = 3000
    onDateClick = "javascript:getFutureDateData(" + loc + ")"
    buttonText = "Predict the Weather"
  }
  else
  {
    instructions = "Input a past date to get the historical weather data"
    minMonth = 1
    maxMonth = 12
    minDay = 1
    maxDay = 31
    minYear = 1970
    maxYear = curYear
    onDateClick = "javascript:getPastDateData(" + loc + ")"
    buttonText = "Display Past Weather Data"
  }

  var popUpText = [
    "<p>" + instructions + "</p>" +
    "<p>Month: <input id='monthInput' type='number' min='" + minMonth + "' max='" + maxMonth + "' width='2' placeholder='" + curMonth.toString() + "'></p>",
    "<p>Day: <input id='dayInput' type='number' min='" + minDay + "' max='" + maxDay + "' width='2' placeholder='" + curDay.toString() + "'></p>",
    "<p>Year: <input id='yearInput' type='number' min='" + minYear + "' max='" + maxYear + "' width='4' placeholder='" + curYear.toString() + "'></p>",
    "<p><button class='button' onclick='" + onDateClick + "'>" + buttonText + "</button></p>",
  ].join("\n")

  L.popup()
    .setContent(popUpText)
    .setLatLng(location)
    .openOn(Map)
}

//------------------------------------------------------------------------------
// Gets the weather for the input futuredate
function getFutureDateData(location) {
  var month = document.getElementById('monthInput').value
  var day = document.getElementById('dayInput').value
  var year = document.getElementById('yearInput').value
  var lat = location.lat
  var lon = location.lon
  var displayDate = month.toString() + "/" + day.toString() + "/" + year.toString()

  L.popup()
    .setContent("Predicting weather for " + displayDate + "... <br><center><img src='spiffygif_30x30.gif'><center>")
    .setLatLng(location)
    .openOn(Map)

  $.ajax("/api/predictConditions/" + lat + "," + lon + "," + month + "," + day, {
    dataType: "json",
    success: function(data, status, jqXhr) {
      gotFutureConditions(location, data, status, jqXhr, displayDate)
    },
    error: function() {
      L.popup()
        .setContent("Error predicting weather for " + displayDate + ", sorry!")
        .setLatLng(location)
        .openOn(Map)
    }
  })
}

//------------------------------------------------------------------------------
// Take returned weather prediction and parse it for display
function gotFutureConditions(location, data, status, jqXhr, dateString) {
  try {
    var noDataAvailable = false;
    if (data.status === "failure") noDataAvailable = true

    var condition = [data.avgTemp, data.frequentCondition, data.iconCode]

    // If no historical data was available, throw error
    // Otherwise, configure the pop-up window to display the data
    if (noDataAvailable)
    {
      throw "No historical data available for " + dateString + ", sorry!"
    }
    else
      showWeatherForDate(true, location, condition, dateString, data.startYear, data.endYear)
  }
  // If no past results were available or error parsing, print message on pop-up
  catch(e) {
    var errMsg;
    if (typeof e === 'string')
      errMsg = e;
    else
    {
      errMsg = "Error predicting weather for " + dateString + ", sorry!"
    }
    L.popup()
      .setContent(errMsg)
      .setLatLng(location)
      .openOn(Map)
    }
}

//------------------------------------------------------------------------------
// Gets the weather for the input past date
function getPastDateData(location) {
  var month = document.getElementById('monthInput').value
  var day = document.getElementById('dayInput').value
  var year = document.getElementById('yearInput').value
  var lat = location.lat
  var lon = location.lon
  var displayDate = month.toString() + "/" + day.toString() + "/" + year.toString()

  L.popup()
    .setContent("Getting weather data for " + displayDate + "... <br><center><img src='spiffygif_30x30.gif'><center>")
    .setLatLng(location)
    .openOn(Map)

  $.ajax("/api/pastConditions/" + lat + "," + lon + "," + month + "," + day + "," + year, {
    dataType: "json",
    success: function(data, status, jqXhr) {
      gotPastConditions(location, data, status, jqXhr, displayDate)
    },
    error: function() {
      L.popup()
        .setContent("Error getting weather data for " + displayDate + ", sorry!")
        .setLatLng(location)
        .openOn(Map)
    }
  })
}

//------------------------------------------------------------------------------
// Take returned past conditions and parse them for display
function gotPastConditions(location, data, status, jqXhr, dateString) {
  try {
    gotPastConditions_(location, data, status, jqXhr, dateString)
  }
  // If no past results were available or error parsing, print message on pop-up
  catch(e) {
    var errMsg;
    if (typeof e === 'string')
      errMsg = e;
    else
    {
      errMsg = "Error getting weather data for " + dateString + ", sorry!"
    }
    L.popup()
      .setContent(errMsg)
      .setLatLng(location)
      .openOn(Map)
    }
}

//------------------------------------------------------------------------------
function gotPastConditions_(location, data, status, jqXhr, dateString) {
  // If there was no data available for this date, show error
  var noDataAvailable = false;
  if (data.errors) noDataAvailable = true

  // If the observation doesn't have the necessary attributes, show error
  var obs = data.observations[0]
  if (null == obs) noDataAvailable = true
  if (null == obs.temp) noDataAvailable = true
  if (null == obs.wx_phrase) obs.wx_phrase = "Unknown"

  var condition = [obs.temp, obs.wx_phrase, obs.wx_icon]

  // If no historical data was available, throw error
  // Otherwise, configure the pop-up window to display the data
  if (noDataAvailable)
  {
    throw "No historical data available for " + dateString + ", sorry!"
  }
  else
    showWeatherForDate(false, location, condition, dateString)
}

//------------------------------------------------------------------------------
// Shows the weather for a particular input date
function showWeatherForDate(showPrediction, location, condition, dateString, startYear, endYear) {
  Map.closePopup()

  var icon = code2icon(condition[2])
  var weather = [
      "<strong>Temperature: </strong> " + condition[0] + "" + "&deg; F<br>",
      "<strong>Conditions: </strong> " + condition[1] + "<br><br>",
      "<i class='wi " + icon + "'></i>"
  ]
  weather = weather.join("\n")

  var descriptor = (showPrediction) ? "will be" : "was"
  var desc = "<p>The weather on " + dateString + " " + descriptor + ":</p>"

  var predictionDates
  if (showPrediction)
    predictionDates = "<p>Prediction based on data from " + startYear.toString() + " to " + endYear.toString()
  else
    predictionDates = ""

  var popupHTML = "<h4>" + location.name + "</h4>" + desc + "<p>" + weather + predictionDates

  L.popup()
    .setContent(popupHTML)
    .setLatLng(location)
    .openOn(Map)
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
