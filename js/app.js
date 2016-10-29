// hard code the data for application
var locations = [
    {
        name: 'Malaysia',
        lat: 4.2,
        lng: 101.9
    },
    {
        name: 'Vietnam',
        lat: 14,
        lng: 108
    },
    {
        name: 'Thailand',
        lat: 15.8,
        lng: 100.9
    },
    {
        name: 'Myanmar',
        lat: 21.9,
        lng: 95
    },
    {
        name: 'Indonesia',
        lat: 0.78,
        lng: 113.2
    },
    {
        name: 'Singapore',
        lat: 1.35,
        lng: 103.8
    }
];

// store map related functions in mapView
var mapView = {
    init: function(locationWithMarkers){

        this.map = new google.maps.Map(document.getElementById('map-view'),
             {
                'center': new google.maps.LatLng(14,108),
                'zoom': 5
            }
        );

        locationWithMarkers.forEach(function(item){
            item.marker.setMap(this.map);
        },this);

        var bound = new google.maps.LatLngBounds();
        locationWithMarkers.forEach(function(item) {
            bound.extend(item.marker.getPosition());
        });

        this.map.fitBounds(bound);
    },

    addMarker: function(location) {
        var locationsWithMarkers = [];
        locations.forEach(function(item){
            item.marker = new google.maps.Marker({
                position: new google.maps.LatLng(item.lat, item.lng),
                title: item.name
            });
            item.marker.addListener('click', function() {
                mapView.openInfoWindow(item);
            });
            locationsWithMarkers.push(item);
        },this);
        return locationsWithMarkers;
    },

    setMarkerVisible: function(locationWithMarkers, visible){
        locationWithMarkers.forEach(function(item){
            item.marker.setVisible(visible);
        },this);
    },

    openInfoWindow: function(locationWithMarker) {
        // if there is one existed, close it
        if(this.infoWindow) {
            this.infoWindow.close();
        } // else create new one
        else{
            this.infoWindow = new google.maps.InfoWindow();
        }

       // Animate marker when open info window
       locationWithMarker.marker.setAnimation(google.maps.Animation.DROP);

       this.infoWindow.open(mapView.map, locationWithMarker.marker);
       this.infoWindow.setContent("Loading Wiki Info for this location...Pleas Wait...");

       // Avoid making unnecessary requests to third party
       if(!locationWithMarker.wiki){
           var myInfo = this.infoWindow;
           jQuery.ajax(
                {
                url: 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + locationWithMarker.name +'&format=json',
                dataType:"jsonp"
                }
            ).done(function(response){
                if(response){
                    locationWithMarker.wiki = response[2][0] + '<br>' + 'Source: <a target="_blank" href="' + response[3][0] + '">Wikipedia</a>';
                    myInfo.setContent(locationWithMarker.wiki);
                }
                else
                {
                    var noDataError = "No Data Available from Wiki.";
                    alert(noDataError);
                    myInfo.setContent(noDataError);
                }

             }).fail(function(){
                var wikiErrorMessage = 'There is an error when loading Wiki Info for . Please try again later';
                alert(wikiErrorMessage);
                myInfo.setContent(locationWithMarker.name  + '\n\r' + wikiErrorMessage);
             });
        }
       else{
            this.infoWindow.setContent(locationWithMarker.wiki);
       }
   },

   closeInfoWindow: function() {
        if(this.infoWindow) {
            this.infoWindow.close();
        }
   }
};

// KO ViewModel
var ViewModel = function() {
    //add marker to our model
    var locationWithMarkers = mapView.addMarker(locations);

    // no filter on initialize
    this.filterKey = ko.observable("");

    // simple filter
    this.locationEntityList = ko.computed(function() {
        var temp = [];
        for(var i = 0; i < locationWithMarkers.length; i++){
            var locationName = locationWithMarkers[i].name.toLowerCase();
            var filterKey = this.filterKey().toLowerCase();
            if(locationName.includes(filterKey)){
                temp.push(locationWithMarkers[i]);
            }
        }
        return temp;
    },this);

    // define event handler for input change event
    this.updateFilterKey = function(data, event) {
        //close infoWindow before filtering
        mapView.closeInfoWindow();

        // clear marker before filtering
        mapView.setMarkerVisible(this.locationEntityList(), false);

        // change filter key triggering the computed value
        this.filterKey(event.target.value);

        // unclear markers for with new computed value
        mapView.setMarkerVisible(this.locationEntityList(), true);
    };

    this.openInfoWindow = function(data, event) {
        mapView.openInfoWindow(data);
    };

    // show or hide list view
    // redraw map
    this.toggleListView = function() {
        var data = this.locationEntityList();
        $('#list-view').toggle(function(){
            $('#map-view-container').width('100%');
            mapView.init(data);
        });
    };

    // init map
    mapView.init(this.locationEntityList());
};


// This function is called when Google Map API is ready
// It then activates ko ViewModel
function googleSuccess() {
    // activate our viewmodel
    ko.applyBindings(new ViewModel());
}

// This function is called when script tag fail to load Google Map API
function googleError() {
    alert("Error in loading Google Map API. Please try the application later.");
}



