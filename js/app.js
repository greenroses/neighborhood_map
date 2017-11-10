const places = [
    {title: 'New England Aquarium', location: {lat: 42.359131, lng: -71.049581}},
    {title: 'Faneuil Hall', location: {lat: 42.359799, lng: -71.054460}},
    {title: 'Museum of Fine Arts, Boston', location: {lat: 42.339381, lng: -71.094048}},
    {title: 'Havard Business School', location: {lat: 42.365515, lng: -71.122141}},
    {title: 'MIT Sloan School of Management', location: {lat: 42.361007, lng: -71.082995}},
    {title: 'Isabella Stewart Gardner Museum', location: {lat: 42.338180, lng: -71.099121}},
    {title: 'Boston Children\'s Museum', location: {lat: 42.351868, lng: -71.049993}},
    {title: 'Museum of Science, Boston', location: {lat: 42.367938, lng: -71.071110}},
    {title: 'Boston National Historical Park', location: {lat: 42.373162, lng: -71.056834}},
    {title: 'Institute of Contemporary Art, Boston', location: {lat: 42.352882, lng: -71.043011}},
    {title: 'Harvard Museum of Natural History', location: {lat: 42.378463, lng: -71.115558}},
    {title: 'Hyatt Regency Boston Cambridge', location: {lat: 42.353903, lng: -71.105453}},
];

let map;
let markers = [];
let currentMarker = null;
let largeInfowindow;

const Place = function(data) {
    this.title = ko.observable(data.title);
    this.location = ko.observable(data.location);
};

// Knockout ViewModel
const ViewModel = function() {
    const self = this;
    self.placeList = ko.observableArray([]);
    //text input field to filter the list items
    self.filter = ko.observable('');
    // either enter or click on filter button will filter the list
    self.setCurrentFilter = function() {
        self.filter(this.filter());
    };
    places.forEach(function(placeItem) {
        self.placeList.push( new Place(placeItem) );
    });

    // filter list items and markers with user input
    self.filterResults = ko.computed(function() {
        if (self.filter().length === 0) {
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
    // clicking on list item will make marker bounce and display infowindow with wikipedia info
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
    };
};

$(document).ready(function() {
    ko.applyBindings(new ViewModel());
});

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
        // clicking a marker opens infowindow and
        // markers animate when clicked
        attachInfoWindow(marker);
    }
    map.fitBounds(bounds);
}

// Attaches an info window to a marker with wikipedia data. When the marker
// is clicked, the info window will open, and the marker will bounce.
function attachInfoWindow(marker) {
    marker.addListener('click', function() {
        populateInfoWindow(marker, largeInfowindow);
        loadData(marker);
        setCurrentMarker(marker);
        toggleBounce(marker);
    });
}

// Stop the animation of the previous marker. and update current marker.
function setCurrentMarker(marker) {
    if (currentMarker) currentMarker.setAnimation(null);
    currentMarker = marker;
}

// Populate infowindow with wikipedia elements, and open infowindow at marker
function populateInfoWindow(marker, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<div class="wikipedia-container">' +
            '<h3 id="marker-header">' + marker.title + '</h3>' +
            '<p id="wikipedia-header">Relevant Wikipedia articles: </p>' +
            '<ul id="wikipedia-links">Relevant Wikipedia articles links</ul></div>');

        infowindow.open(map, marker);
        infowindow.addListener('closeclick', function() {
            infowindow.setMarker(null);
        });
    }
}

// Google maps marker animation: click to bounce or stop bounce
function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

// Use wikipedia API to display relative article links of each place in InfoWindow
function loadData(marker) {
    // #wikipedia-links is defined in populateInfoWindow function
    const $wikiElem = $('#wikipedia-links');

    // clear out old data before new request
    $wikiElem.text("");

    // Wikipedia AJAX request
    let wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search='+ marker.title + '&format=json&callback=wikiCallback';

    // handle error
    const wikiRequestTimeout = setTimeout(function(){
        $wikiElem.text("failed to get wikipedia resources");
    }, 8000);

    //jQuery ajax call
    $.ajax({
        url: wikiUrl,
        dataType: "jsonp",
        success: function( response ) {
            let articleList = response[1];
            let wikiResult = '';
            for (let i=0; i<articleList.length; i++) {
                articleStr = articleList[i];
                let url = 'http://en.wikipedia.org/wiki/'+ articleStr;
                /*$wikiElem.append('<li><a href="' + url + '" target="_blank">' +
                    articleStr + '</a></li>');*/
                wikiResult = wikiResult + '<li><a href="' + url + '" target="_blank">' +
                    articleStr + '</a></li>';
                largeInfowindow.setContent('<div class="wikipedia-container">' +
                    '<h3 id="marker-header">' + marker.title + '</h3>' +
                    '<p id="wikipedia-header">Relevant Wikipedia articles: </p>' +
                    '<ul id="wikipedia-links">' +
                    wikiResult + '</ul></div>');
            }
            // if no related wiki articles
            if (articleList.length === 0) {
                //$wikiElem.text("No relevant wikipedia articles");
                largeInfowindow.setContent('<div class="wikipedia-container">' +
                    '<h3 id="marker-header">' + marker.title + '</h3>' +
                    '<p id="wikipedia-header">Relevant Wikipedia articles: </p>' +
                    '<ul id="wikipedia-links">No relevant wikipedia articles</ul></div>');
            }
            clearTimeout(wikiRequestTimeout);
        }
    });

    return false;
}

// Google maps error fallback function
function mapError() {
    alert('Cannot load Google Maps');
}

// Click hamburger button to hide or show the side panel
let sideShow = false;
function sideControl() {
    // detect whether side panel is currently shown or hidden
    // side panel might be shown or hidden depending on screen sizes (media query)
    let style = window.getComputedStyle(document.getElementById('floating-panel'));
    if (style.display === 'block') {
        sideShow = true;
    }
    // if side panel is shown, clicking the hamburger btn will hide the side panel and move the btn to left of the screen
    // else if side panel is hidden, clicking the hamburger btn will show the side panel and move the btn to right of the side panel
    if (sideShow) {
        document.getElementById('floating-panel').style.display = 'none';
        document.getElementById('side-control').style.left = '0px';
        sideShow = false;
    } else {
        $('#floating-panel')[0].style.display = 'block';    //$('#floating-panel')[0] is equal to document.getElementById('floating-panel')
        document.getElementById('side-control').style.left = '281px';
        sideShow = true;
    }
}