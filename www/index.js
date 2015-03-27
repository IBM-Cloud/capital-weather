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

Locations = getLocations()

//------------------------------------------------------------------------------
function onLoad() {
  Map = L.map("map")

  // add markers, calculate bounds
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

  // add info box
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

  Map.on("dblclick", function(e) {
    var location = {
      lat:  e.latlng.lat,
      lon:  e.latlng.lng,
      name: e.latlng.lat + "," + e.latlng.lng
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

  // fit to bounds
  var bounds = [
    { lat: 44.32, lon:  -69.76 }, // maine
    { lat: 38.55, lon: -121.46 }, // california
  ]
  Map.fitBounds(bounds, {padding:[0,0]})
}

//------------------------------------------------------------------------------
function displayHelp(location) {
  Help
    .setLatLng(Map.getCenter())
    .openOn(Map)
}

//------------------------------------------------------------------------------
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
function gotCurrentConditions(location, data, status, jqXhr) {
  var observation = data.observation
  if (null == observation) return

  var icon_code = observation.icon_code
  var icon = code2icon(icon_code)

  var desc = observation.phrase_32char

  var temp = ""
  if (observation.imperial) {
    temp = observation.imperial.temp + "F - "
  }

  var icon = L.divIcon({
    html:      "<i class='wi " + icon + "'></i>",
    iconSize:  [64,64],
    className: "location-icon"
  })

  var popupText = location.name + "<br>" + temp + desc

  var marker = location.marker
  marker.setIcon(icon)
  marker.bindPopup(popupText)
  marker.setOpacity(1)

  // delay display to let bootstrap do it's thing
  setTimeout(displayMarker, 1000)

  //-----------------------------------
  function displayMarker() {

  }
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
