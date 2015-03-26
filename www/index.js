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

Locations = getLocations()

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

function getLocations() {
  return [
    { lat: 32.36, lon:  -86.27, name: "Montgomery, Alabama" },
    { lat: 58.30, lon: -134.41, name: "Juneau, Alaska" },
    { lat: 33.44, lon: -112.07, name: "Phoenix, Arizona" },
    { lat: 34.73, lon:  -92.33, name: "Little Rock, Arkansas" },
    { lat: 38.55, lon: -121.46, name: "Sacramento, California" },
    { lat: 39.73, lon: -104.98, name: "Denver, Colorado" },
    { lat: 41.76, lon:  -72.67, name: "Hartford, Connecticut" },
    { lat: 39.16, lon:  -75.52, name: "Dover, Delaware" },
    { lat: 30.45, lon:  -84.27, name: "Tallahassee, Florida" },
    { lat: 33.76, lon:  -84.39, name: "Atlanta, Georgia" },
    { lat: 21.30, lon:  -157.8, name: "Honolulu, Hawaii" },
    { lat: 43.61, lon:  -116.2, name: "Boise, Idaho" },
    { lat: 39.78, lon:  -89.65, name: "Springfield, Illinois" },
    { lat: 39.79, lon:  -86.14, name: "Indianapolis, Indiana" },
    { lat: 41.59, lon:  -93.62, name: "Des Moines, Iowa" },
    { lat: 39.04, lon:  -95.69, name: "Topeka, Kansas" },
    { lat: 38.19, lon:  -84.86, name: "Frankfort, Kentucky" },
    { lat: 30.45, lon:  -91.14, name: "Baton Rouge, Louisiana" },
    { lat: 44.32, lon:  -69.76, name: "Augusta, Maine" },
    { lat: 38.97, lon:  -76.50, name: "Annapolis, Maryland" },
    { lat: 42.23, lon:  -71.02, name: "Boston, Massachusetts" },
    { lat: 42.73, lon:  -84.54, name: "Lansing, Michigan" },
    { lat: 44.95, lon:  -93.09, name: "Saint Paul, Minnesota" },
    { lat: 32.32, lon:  -90.20, name: "Jackson, Mississippi" },
    { lat: 38.57, lon:  -92.18, name: "Jefferson City, Missouri" },
    { lat: 46.59, lon: -112.02, name: "Helana, Montana" },
    { lat: 40.80, lon:  -96.67, name: "Lincoln, Nebraska" },
    { lat: 39.16, lon: -119.75, name: "Carson City, Nevada" },
    { lat: 43.22, lon:  -71.54, name: "Concord, New Hampshire" },
    { lat: 40.22, lon:  -74.75, name: "Trenton, New Jersey" },
    { lat: 35.66, lon: -105.96, name: "Santa Fe, New Mexico" },
    { lat: 42.65, lon:  -73.78, name: "Albany, New York" },
    { lat: 35.77, lon:  -78.63, name: "Raleigh, North Carolina" },
    { lat: 48.81, lon: -100.77, name: "Bismarck, North Dakota" },
    { lat: 39.96, lon:  -83.00, name: "Columbus, Ohio" },
    { lat: 35.48, lon:  -97.53, name: "Oklahoma City, Oklahoma" },
    { lat: 44.93, lon: -123.02, name: "Salem, Oregon" },
    { lat: 40.26, lon:  -76.87, name: "Harrisburg, Pennsylvania" },
    { lat: 41.82, lon:  -71.42, name: "Providence, Rhode Island" },
    { lat: 34.00, lon:  -81.03, name: "Columbia, South Carolina" },
    { lat: 44.36, lon: -100.33, name: "Pierre, South Dakota" },
    { lat: 36.16, lon:  -86.78, name: "Nashville, Tennessee" },
    { lat: 30.26, lon:  -97.75, name: "Austin, Texas" },
    { lat: 40.75, lon: -111.89, name: "Salt Lake City, Utah" },
    { lat: 44.26, lon:  -72.57, name: "Montpelier, Vermont" },
    { lat: 37.54, lon:  -77.46, name: "Richmond, Virginia" },
    { lat: 47.04, lon: -122.89, name: "Olympia, Washington" },
    { lat: 38.34, lon:  -81.63, name: "Charleston, West Virginia" },
    { lat: 43.07, lon:  -89.38, name: "Madison, Wisconsin" },
    { lat: 41.14, lon: -104.80, name: "Cheyenne, Wyoming" }
  ]
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
