// Licensed under the Apache License. See footer for details.

//------------------------------------------------------------------------------
// leaflet - the "L" things:
//   http://leafletjs.com/reference.html
//
// esri-leaflet - the "L.esri" things
//   http://esri.github.io/esri-leaflet/api-reference/
//------------------------------------------------------------------------------

var Map

$(onLoad)

Locations = [
  {lat: 40.71, lon:  -74.00, name: "New York, NY"},
  {lat: 37.78, lon: -122.41, name: "San Francisco, CA"}
]

//------------------------------------------------------------------------------
function onLoad() {
  Map = L.map("map")

  var bounds = []
  Locations.forEach(function(location){
    var icon = L.icon({
      iconUrl:   "icon.png",
      iconSize:  [32,32],
      className: "location-icon",
    })

    var marker = L.marker(location, {icon: icon})
    location.marker = marker

    marker.addTo(Map)

    bounds.push([location.lat, location.lon])
  })

  var layer = L.esri.basemapLayer("Streets")
  layer.addTo(Map)

  Map.fitBounds(bounds, {padding:[20,20]})

  // Map.on("dragend", onViewReset)
  Map.on("moveend", onViewReset)
  Map.on("zoomend", onViewReset)
}

//------------------------------------------------------------------------------
function onViewReset() {
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
