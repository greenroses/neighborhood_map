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
            markers.forEach(function(item) {
                item.setMap(map);
            });
            return places;
        }
        else {
            markers.forEach(function(item) {
                item.setMap(null);
            });
            markers.filter((item) => item.title.toLowerCase().includes(self.filter().toLowerCase()) === true).forEach(function(item) {
                item.setMap(map);
            });
            return places.filter((item) => item.title.toLowerCase().includes(self.filter().toLowerCase()) === true);
        }
    }, this);

    self.setPlace = function(clickedPlace) {
        console.log('hi');
        console.log('clickedPlace', clickedPlace);
        console.log('clickedPlace.title', clickedPlace.title);
        if (currentMarker) currentMarker.setAnimation(null);
        //!!!Remember to add [0] because the result of array filter is an array
        currentMarker = markers.filter(item => item.title === clickedPlace.title)[0];
        toggleBounce(currentMarker);
        populateInfoWindow(currentMarker, largeInfowindow);
        loadData(currentMarker);
    }
};

$(document).ready(function() {
    ko.applyBindings(new ViewModel());
});

let map;
let markers = [];
let currentMarker = null;
let largeInfowindow;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 42.353903, lng: -71.105453},
        zoom: 13,
        mapTypeControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT
        },
    });

    largeInfowindow = new google.maps.InfoWindow();
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
            loadData(this);
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
        infowindow.setContent('<div class="wikipedia-container">' +
            '<h3 id="marker-header">' + marker.title + '</h3>' +
            '<p id="wikipedia-header">Relevant Wikipedia articles: </p>' +
            '<ul id="wikipedia-links">Relevant Wikipedia articles links</ul></div>')

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

function loadData(marker) {

    var $wikiElem = $('#wikipedia-links');

    // clear out old data before new request
    $wikiElem.text("");

    //Wikipedia AJAX request
    var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search='+ marker.title + '&format=json&callback=wikiCallback';

    var wikiRequestTimeout = setTimeout(function(){
        $wikiElem.text("failed to get wikipedia resources");
    }, 8000);

    $.ajax({
        url: wikiUrl,
        dataType: "jsonp",
        success: function( response ) {
            var articleList = response[1];

            for (var i=0; i<articleList.length; i++) {
                articleStr = articleList[i];
                var url = 'http://en.wikipedia.org/wiki/'+ articleStr;
                $wikiElem.append('<li><a href="' + url + '" target="_blank">' +
                    articleStr + '</a></li>');
            };

            if (articleList.length == 0) {
                $wikiElem.text("No relevant wikipedia articles");
            }

            clearTimeout(wikiRequestTimeout);
        }
    });

    return false;
};

function mapError() {
    console.log('map error');
    alert('Cannot load Google Maps');
};

let sideShow = false;
function sideControl() {
    let style = window.getComputedStyle(document.getElementById('floating-panel'));
    if (style.display === 'block') {
        sideShow = true;
    }
    if (sideShow) {
        document.getElementById('floating-panel').style.display = 'none';
        document.getElementById('side-control').style.left = '0px';
        sideShow = false;
    } else {
        $('#floating-panel')[0].style.display = 'block';    //$('#floating-panel')[0] is equal to document.getElementById('floating-panel')
        document.getElementById('side-control').style.left = '281px';
        sideShow = true;
    }
};