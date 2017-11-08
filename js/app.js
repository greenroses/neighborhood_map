const places = [
    {title: 'Hyatt Regency Boston Cambridge', location: {lat: 42.353903, lng: -71.105453}},
    {title: 'Havard Business School', location: {lat: 42.365515, lng: -71.122141}},
    {title: 'MIT Sloan School of Management', location: {lat: 42.361007, lng: -71.082995}},
    {title: 'New England Aquarium', location: {lat: 42.359131, lng: -71.049581}},
    {title: 'Museum of Fine Arts, Boston', location: {lat: 42.339381, lng: -71.094048}},
    {title: 'Isabella Stewart Gardner Museum', location: {lat: 42.338180, lng: -71.099121}},
    {title: 'Boston Children\'s Museum', location: {lat: 42.351868, lng: -71.049993}}
];

var Place = function(data) {
    this.title = ko.observable(data.title);
    this.location = ko.observable(data.location);
};

var ViewModel = function() {
    var self = this;
    self.placeList = ko.observableArray([]);
    self.showList = ko.observableArray([]);
    self.filter = ko.observable('');
    // either enter or click on filter button will filter the list
    self.setCurrentFilter = function() {
        self.filter(this.filter());
    }
    places.forEach(function(placeItem) {
        self.placeList.push( new Place(placeItem) );
    });

    self.filterResults = ko.computed(function() {
        if (self.filter().length == 0) {
            return self.placeList();
        }
        else {
            return places.filter((item) => item.title.includes(self.filter()) === true);
        }
    }, this);

    self.setPlace = function(clickedPlace) {
        if (currentMarker) currentMarker.setAnimation(null);
        //To get the value of clickedPlace.title you need to remember to use parentheses
        //like this: console.log(clickedPlace.title())
        //Remember to add [0] because the result of array filter is an array
        currentMarker = markers.filter(item => item.title === clickedPlace.title())[0];
        toggleBounce(currentMarker);
        //populateInfoWindow(currentMarker, smallInfowindow);
    }
};

$(document).ready(function() {
    ko.applyBindings(new ViewModel());
});

let map;
let markers = [];
let currentMarker = null;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 42.353903, lng: -71.105453},
        zoom: 13
    });

    let largeInfowindow = new google.maps.InfoWindow();
    let bounds = new google.maps.LatLngBounds();

    for (let i=0; i<places.length; i++) {
        let position = places[i].location;
        let title = places[i].title;
        let marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i
        });
        markers.push(marker);
        bounds.extend(marker.position);
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
            if (currentMarker) currentMarker.setAnimation(null);
            currentMarker = marker;
            toggleBounce(this);
        });
    }
    map.fitBounds(bounds);
}

function populateInfoWindow(marker, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<div>' + marker.title +'</div>');
        infowindow.open(map, marker);
        infowindow.addListener('closeclick', function() {
            infowindow.setMarker(null);
        });
    }
}

function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}