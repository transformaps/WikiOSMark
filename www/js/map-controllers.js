
var mapControllers = angular.module('mapControllers', [])

.controller('MapCtrl', function($scope, $rootScope, $state, $timeout, $cordovaGeolocation, $http, leafletData, leafletMapEvents, leafletMarkerEvents, leafletBoundsHelpers, $ionicSideMenuDelegate, OpenStreetMap, Wiki, AppSettings, GeoLocation, PhotoGallery, Wheelmap) {

	//
	// Variables & initialization
	//

	var osmColors = {
		wiki: '#0f0',
		building: '#800000',
		leisure: '#196619',
		highway: '#4d4d33',
		nodes: '#ff7800',
		unspecified_way: '#404040',
		unspecified: '#00f'
	}

	var legend = {
		position: 'topleft',
		colors: [ osmColors.wiki, osmColors.building, osmColors.leisure, osmColors.highway, osmColors.unspecified_way, osmColors.nodes, osmColors.unspecified ],
		labels: [ 'Element with a Wiki tag', 'Buildings', 'Leisure', 'Highways', 'Other way elements', 'Node elements', 'Default OSM color' ]
	}

	$scope.map = {
    defaults: {
      zoomControlPosition: 'topleft'
    },
    markers : {},
    events: {
      map: {
        enable: ['context'],
        logic: 'emit'
      }
    }
  };

	$scope.events = {
		markers: {
		   enable: leafletMarkerEvents.getAvailableEvents(),
		}
  };

	var wheelmapLayer = null;
	var photoLayer = null;
	var flickrPhotoLayer = null;
	var mapillaryPhotoLayer = null;
	var osmGeoJsonLayer = null;

	var tilesDict = {
		openstreetmap: {
			name: "OpenStreetMap",
			url: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
			type: 'xyz',
			options: {
				attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}
		},
		osmCycleLayer: {
			name: "OpenCycleMap",
			url: 'http://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png',
			type: 'xyz',
			options: {
    		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Maps &copy; <a href="http://thunderforest.com/">Thunderforest</a>',
    		maxZoom: 18
			}
		},
		mapBoxLayer: {
			name: "MapBox",
			url: 'http://{s}.tiles.mapbox.com/v3/' + 'ernoma.i04d787e' + '/{z}/{x}/{y}.png',
			type: 'xyz',
			options: {
    		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    		maxZoom: 20
			}
		}
	}

	var bounds = leafletBoundsHelpers.createBoundsFromArray([
				[ 71.2, 32.8 ],
        [ 53.9, -24.1 ]
  ]);

	angular.extend($scope, {
		tiles: tilesDict.openstreetmap,
		bounds: bounds,
		center: {},
		layers: {
			baselayers: {} //tilesDict
		},
		markers: {},
		legend: null
	});

	var osmLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
			maxZoom: 20,
			maxNativeZoom: 19
	});
	var osmCycleLayer = L.tileLayer('http://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png', {
	    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, , Maps &copy; <a href="http://thunderforest.com/">Thunderforest</a>',
			maxZoom: 20,
			maxNativeZoom: 18
	});
	var mapBoxLayer = L.tileLayer('http://{s}.tiles.mapbox.com/v3/' + 'ernoma.i04d787e' + '/{z}/{x}/{y}.png', {
	    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
	    maxZoom: 20
	});
	var bingLayer = new L.BingLayer('Agf7Ot_un-nQxTrh4Vg6bqThCzQ5KH6kF2oLndffl3LlclN5dY3ELe80I6Kkj5Qd', {type: 'AerialWithLabels', maxZoom: 20,
	maxNativeZoom: 18});

	var baseMaps = {
			"OpenStreetMap": osmLayer,
			"OpenCycleMap": osmCycleLayer,
			"Bing aerial": bingLayer,
			"MapBox": mapBoxLayer
	}

	angular.element(document).ready(function () {
		// Adding Bing layer is maybe easiest this way
		leafletData.getMap().then(function(map) {
			//console.log(map);
			L.control.layers(baseMaps).addTo(map);
			map.eachLayer(function (layer) {
				//console.log(layer);
				map.removeLayer(layer);
			});
			map.addLayer(mapBoxLayer);
		});

		//console.log("in ready");
	});

	//
	// Event handlers
	//

	$scope.$on( "locateMe", function( event ) {
		$scope.locateMe();
	});

	$scope.$on( "showOSMObjects", function( event ) {
		console.log(event);
		$scope.findOSMObjects();
	});

	$scope.$on( "showLegend", function( event ) {
		console.log(event);
		console.log($scope.legend);
		if ($scope.mapControllerData.legendShown == false) {
			angular.extend($scope, {
				legend: legend
			});
			$scope.mapControllerData.legendShown = true;
			console.log($scope.legend);
		}
		else {
			angular.extend($scope, {
				legend: null
			});
			$scope.mapControllerData.legendShown = false;
		}
	});

	$scope.$on( "updateWikiLayers", function( event ) {
		$scope.updateWikiLayers();
	});

	$scope.$on( "photoAdded", function ( event ) {
		$scope.updatePhotoMapLayer();
	});

	$scope.$on( "showFlickrPhotos", function (event) {
		if (!$scope.mapControllerData.flickrPhotosShown) {
			leafletData.getMap().then(function(map) {
				//bbox.min_lng + "," + bbox.min_lat + "," + bbox.max_lng + "," + bbox.max_lat
				var bounds = map.getBounds();
				var bbox = {
					min_lng: bounds.getWest(),
					min_lat: bounds.getSouth(),
					max_lng: bounds.getEast(),
					max_lat: bounds.getNorth()
				}
				console.log(bbox);

				//var data = {"photos":{"page":1,"pages":7528,"perpage":9,"total":"67746","photo":[{"id":"30488776035","owner":"11912988@N02","secret":"8b177af23e","server":"8577","farm":9,"title":"New fresh air is coming #aj20 #aljazeera #aj2016 #great #new_building #aja","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"25.314511","longitude":"51.496547","accuracy":"16","context":0,"place_id":"1yGIw8VUV7NaufVgQA","woeid":"55922532","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm9.staticflickr.com\/8577\/30488776035_8b177af23e_m.jpg","height_s":"240","width_s":"240","url_o":"https:\/\/farm9.staticflickr.com\/8577\/30488776035_b8587a5980_o.jpg","height_o":"1080","width_o":"1080"},{"id":"30401673871","owner":"148301490@N03","secret":"8b415de6f4","server":"8583","farm":9,"title":"Cascade Complex in 2014","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"40.189979","longitude":"44.515442","accuracy":"16","context":0,"place_id":"q62C_I9TULtsfefR","woeid":"2214662","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm9.staticflickr.com\/8583\/30401673871_8b415de6f4_m.jpg","height_s":"140","width_s":"240","url_o":"https:\/\/farm9.staticflickr.com\/8583\/30401673871_ca39cf918e_o.jpg","height_o":"432","width_o":"742"},{"id":"30432059555","owner":"51065046@N05","secret":"a0ec7322ee","server":"8267","farm":9,"title":"Enter the Lotfollah","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"32.657222","longitude":"51.678888","accuracy":"16","context":0,"place_id":"TBWrXzFTUL.szzcA","woeid":"2254572","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm9.staticflickr.com\/8267\/30432059555_a0ec7322ee_m.jpg","height_s":"240","width_s":"159","url_o":"https:\/\/farm9.staticflickr.com\/8267\/30432059555_bfcbddcd0e_o.jpg","height_o":"4066","width_o":"2699"},{"id":"29800432554","owner":"10485860@N00","secret":"71de4c5727","server":"5632","farm":6,"title":"Sunset","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"22.500121","longitude":"70.182529","accuracy":"16","context":0,"place_id":"68R_3hxQUL9x8wFmbg","woeid":"12586424","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm6.staticflickr.com\/5632\/29800432554_71de4c5727_m.jpg","height_s":"240","width_s":"240","url_o":"https:\/\/farm6.staticflickr.com\/5632\/29800432554_03a07ce9f4_o.jpg","height_o":"1080","width_o":"1080"},{"id":"30427000035","owner":"29436924@N00","secret":"6659d236e9","server":"5507","farm":6,"title":"Physical text...been a while... #visittoabookstore, #irresistibleurgetobuyeverything,  #missthesmell, #withdrawalsymtom, #misstouchingbooks, #goingbacktoebooksisgoingtobetough, #insearchofabirthdaygift, #lovebooks, #bookworm, #MeinKampfisstillabestseller,","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"19.135880","longitude":"72.825680","accuracy":"16","context":0,"place_id":"mY8Xe19YUrKH2eFJ.w","woeid":"90889080","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm6.staticflickr.com\/5507\/30427000035_6659d236e9_m.jpg","height_s":"240","width_s":"192","url_o":"https:\/\/farm6.staticflickr.com\/5507\/30427000035_310b492dc2_o.jpg","height_o":"1350","width_o":"1080"},{"id":"29768381463","owner":"145748390@N03","secret":"04d9aabb93","server":"5339","farm":6,"title":"Table is Set | Scubaspa Maldives","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"3.943295","longitude":"72.881477","accuracy":"16","context":0,"place_id":"AXtOfupTULyWt9gh","woeid":"2268295","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm6.staticflickr.com\/5339\/29768381463_04d9aabb93_m.jpg","height_s":"180","width_s":"240","url_o":"https:\/\/farm6.staticflickr.com\/5339\/29768381463_bd6b431969_o.jpg","height_o":"810","width_o":"1080"},{"id":"30349822616","owner":"145748390@N03","secret":"5efebaa7f1","server":"5576","farm":6,"title":"Fresh for Mojitos | Scubaspa Maldives","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"3.943295","longitude":"72.881477","accuracy":"16","context":0,"place_id":"AXtOfupTULyWt9gh","woeid":"2268295","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm6.staticflickr.com\/5576\/30349822616_5efebaa7f1_m.jpg","height_s":"198","width_s":"240","url_o":"https:\/\/farm6.staticflickr.com\/5576\/30349822616_a6447abc6d_o.jpg","height_o":"889","width_o":"1080"},{"id":"30268537602","owner":"53253289@N03","secret":"6bbb9aea85","server":"5589","farm":6,"title":"20161002_1205_Georgia_Lumia 930_077.jpg","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"41.836408","longitude":"43.389872","accuracy":"16","context":0,"place_id":"UvRj1hVQW7xvzGnD","woeid":"1962649","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm6.staticflickr.com\/5589\/30268537602_6bbb9aea85_m.jpg","height_s":"135","width_s":"240","url_o":"https:\/\/farm6.staticflickr.com\/5589\/30268537602_561bc174ae_o.jpg","height_o":"3024","width_o":"5376"},{"id":"30087727760","owner":"53253289@N03","secret":"2eeba74f41","server":"5641","farm":6,"title":"20160930_1901_Georgia_Lumia 930_096.jpg","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"41.687594","longitude":"44.805524","accuracy":"16","context":0,"place_id":"8IGWCv5QW7yShirL","woeid":"1965878","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm6.staticflickr.com\/5641\/30087727760_2eeba74f41_m.jpg","height_s":"135","width_s":"240","url_o":"https:\/\/farm6.staticflickr.com\/5641\/30087727760_b1f35990c8_o.jpg","height_o":"2701","width_o":"4802"}]},"stat":"ok"}
				PhotoGallery.getFlickrPhotos(bbox, AppSettings.getFlickrPhotoMaxCount(), function(data) {
					console.log(data);
					//console.log(map);

					flickrPhotoLayer = L.photo.cluster().on('click', function (evt) {
						// var photo = evt.layer.photo,
						// 	template = '<img src="{url}"/></a><p>{caption}</p>';
						//
						console.log(evt);
						// 	evt.layer.bindPopup(L.Util.template(template, photo), {
						// 		className: 'leaflet-popup-photo',
						// 		minWidth: 400
						// 	}).openPopup();

						$scope.mapControllerData.selectedFlickrPhoto = {
							lat: evt.layer.photo.lat,
							lng: evt.layer.photo.lng,
							url: evt.layer.photo.url,
							caption: evt.layer.photo.caption,
							thumbnail: evt.layer.photo.thumbnail,
							photoID: evt.layer.photo.photoID
						}

						if (evt.layer != undefined) {
							$state.go("tab.photo-detail", { source: "flickr", photoID: evt.layer.photo.photoID });
						}
					});

					//console.log(map);
					var photos = [];

					var photoArray = data.photos.photo;
					for (var i = 0; i < photoArray.length; i++) {
						photos.push({
									lat: parseFloat(photoArray[i].latitude),
									lng: parseFloat(photoArray[i].longitude),
									url: photoArray[i].url_o,
									caption: photoArray[i].title,
									thumbnail: photoArray[i].url_s,
									photoID: parseInt(photoArray[i].id)
						});
					}
					//console.log(photos);
					flickrPhotoLayer.add(photos).addTo(map);

					$scope.mapControllerData.flickrPhotosShown = true;
				});
			});
		}
		else if (flickrPhotoLayer != null) {
			leafletData.getMap().then(function(map) {
				map.removeLayer(flickrPhotoLayer);
				$scope.mapControllerData.flickrPhotosShown = false;
			});
		}
	});

	$scope.$on( "showMapillaryPhotos", function (event) {
		if (!$scope.mapControllerData.mapillaryPhotosShown) {
			leafletData.getMap().then(function(map) {
				//bbox.min_lng + "," + bbox.min_lat + "," + bbox.max_lng + "," + bbox.max_lat
				var bounds = map.getBounds();
				var bbox = {
					min_lng: bounds.getWest(),
					min_lat: bounds.getSouth(),
					max_lng: bounds.getEast(),
					max_lat: bounds.getNorth()
				}
				console.log(bbox);

				//var data = {"photos":{"page":1,"pages":7528,"perpage":9,"total":"67746","photo":[{"id":"30488776035","owner":"11912988@N02","secret":"8b177af23e","server":"8577","farm":9,"title":"New fresh air is coming #aj20 #aljazeera #aj2016 #great #new_building #aja","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"25.314511","longitude":"51.496547","accuracy":"16","context":0,"place_id":"1yGIw8VUV7NaufVgQA","woeid":"55922532","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm9.staticflickr.com\/8577\/30488776035_8b177af23e_m.jpg","height_s":"240","width_s":"240","url_o":"https:\/\/farm9.staticflickr.com\/8577\/30488776035_b8587a5980_o.jpg","height_o":"1080","width_o":"1080"},{"id":"30401673871","owner":"148301490@N03","secret":"8b415de6f4","server":"8583","farm":9,"title":"Cascade Complex in 2014","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"40.189979","longitude":"44.515442","accuracy":"16","context":0,"place_id":"q62C_I9TULtsfefR","woeid":"2214662","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm9.staticflickr.com\/8583\/30401673871_8b415de6f4_m.jpg","height_s":"140","width_s":"240","url_o":"https:\/\/farm9.staticflickr.com\/8583\/30401673871_ca39cf918e_o.jpg","height_o":"432","width_o":"742"},{"id":"30432059555","owner":"51065046@N05","secret":"a0ec7322ee","server":"8267","farm":9,"title":"Enter the Lotfollah","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"32.657222","longitude":"51.678888","accuracy":"16","context":0,"place_id":"TBWrXzFTUL.szzcA","woeid":"2254572","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm9.staticflickr.com\/8267\/30432059555_a0ec7322ee_m.jpg","height_s":"240","width_s":"159","url_o":"https:\/\/farm9.staticflickr.com\/8267\/30432059555_bfcbddcd0e_o.jpg","height_o":"4066","width_o":"2699"},{"id":"29800432554","owner":"10485860@N00","secret":"71de4c5727","server":"5632","farm":6,"title":"Sunset","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"22.500121","longitude":"70.182529","accuracy":"16","context":0,"place_id":"68R_3hxQUL9x8wFmbg","woeid":"12586424","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm6.staticflickr.com\/5632\/29800432554_71de4c5727_m.jpg","height_s":"240","width_s":"240","url_o":"https:\/\/farm6.staticflickr.com\/5632\/29800432554_03a07ce9f4_o.jpg","height_o":"1080","width_o":"1080"},{"id":"30427000035","owner":"29436924@N00","secret":"6659d236e9","server":"5507","farm":6,"title":"Physical text...been a while... #visittoabookstore, #irresistibleurgetobuyeverything,  #missthesmell, #withdrawalsymtom, #misstouchingbooks, #goingbacktoebooksisgoingtobetough, #insearchofabirthdaygift, #lovebooks, #bookworm, #MeinKampfisstillabestseller,","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"19.135880","longitude":"72.825680","accuracy":"16","context":0,"place_id":"mY8Xe19YUrKH2eFJ.w","woeid":"90889080","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm6.staticflickr.com\/5507\/30427000035_6659d236e9_m.jpg","height_s":"240","width_s":"192","url_o":"https:\/\/farm6.staticflickr.com\/5507\/30427000035_310b492dc2_o.jpg","height_o":"1350","width_o":"1080"},{"id":"29768381463","owner":"145748390@N03","secret":"04d9aabb93","server":"5339","farm":6,"title":"Table is Set | Scubaspa Maldives","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"3.943295","longitude":"72.881477","accuracy":"16","context":0,"place_id":"AXtOfupTULyWt9gh","woeid":"2268295","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm6.staticflickr.com\/5339\/29768381463_04d9aabb93_m.jpg","height_s":"180","width_s":"240","url_o":"https:\/\/farm6.staticflickr.com\/5339\/29768381463_bd6b431969_o.jpg","height_o":"810","width_o":"1080"},{"id":"30349822616","owner":"145748390@N03","secret":"5efebaa7f1","server":"5576","farm":6,"title":"Fresh for Mojitos | Scubaspa Maldives","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"3.943295","longitude":"72.881477","accuracy":"16","context":0,"place_id":"AXtOfupTULyWt9gh","woeid":"2268295","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm6.staticflickr.com\/5576\/30349822616_5efebaa7f1_m.jpg","height_s":"198","width_s":"240","url_o":"https:\/\/farm6.staticflickr.com\/5576\/30349822616_a6447abc6d_o.jpg","height_o":"889","width_o":"1080"},{"id":"30268537602","owner":"53253289@N03","secret":"6bbb9aea85","server":"5589","farm":6,"title":"20161002_1205_Georgia_Lumia 930_077.jpg","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"41.836408","longitude":"43.389872","accuracy":"16","context":0,"place_id":"UvRj1hVQW7xvzGnD","woeid":"1962649","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm6.staticflickr.com\/5589\/30268537602_6bbb9aea85_m.jpg","height_s":"135","width_s":"240","url_o":"https:\/\/farm6.staticflickr.com\/5589\/30268537602_561bc174ae_o.jpg","height_o":"3024","width_o":"5376"},{"id":"30087727760","owner":"53253289@N03","secret":"2eeba74f41","server":"5641","farm":6,"title":"20160930_1901_Georgia_Lumia 930_096.jpg","ispublic":1,"isfriend":0,"isfamily":0,"latitude":"41.687594","longitude":"44.805524","accuracy":"16","context":0,"place_id":"8IGWCv5QW7yShirL","woeid":"1965878","geo_is_family":0,"geo_is_friend":0,"geo_is_contact":0,"geo_is_public":1,"url_s":"https:\/\/farm6.staticflickr.com\/5641\/30087727760_2eeba74f41_m.jpg","height_s":"135","width_s":"240","url_o":"https:\/\/farm6.staticflickr.com\/5641\/30087727760_b1f35990c8_o.jpg","height_o":"2701","width_o":"4802"}]},"stat":"ok"}
				PhotoGallery.getMapillaryPhotos(bbox, AppSettings.getMapillaryPhotoMaxCount(), function(data) {
					console.log(data);
					//console.log(map);

					mapillaryPhotoLayer = L.photo.cluster().on('click', function (evt) {
						// var photo = evt.layer.photo,
						// 	template = '<img src="{url}"/></a><p>{caption}</p>';
						//
						console.log(evt);
						// 	evt.layer.bindPopup(L.Util.template(template, photo), {
						// 		className: 'leaflet-popup-photo',
						// 		minWidth: 400
						// 	}).openPopup();

						$scope.mapControllerData.selectedMapillaryPhoto = {
							lat: evt.layer.photo.lat,
							lng: evt.layer.photo.lng,
							url: evt.layer.photo.url,
							caption: evt.layer.photo.caption,
							thumbnail: evt.layer.photo.thumbnail,
							photoID: evt.layer.photo.photoID
						}

						if (evt.layer != undefined) {
							$state.go("tab.photo-detail", { source: "mapillary", photoID: evt.layer.photo.photoID });
						}
					});

					//console.log(map);
					var photos = [];

					var photoArray = data.ims;
					for (var i = 0; i < photoArray.length; i++) {
						photos.push({
									lat: photoArray[i].lat,
									lng: photoArray[i].lon,
									url: "https://d1cuyjsrcm0gby.cloudfront.net/" + photoArray[i].key + "/thumb-2048.jpg",
									caption: "Photo by " + photoArray[i].user,
									thumbnail: "https://d1cuyjsrcm0gby.cloudfront.net/" + photoArray[i].key + "/thumb-320.jpg",
									photoID: photoArray[i].key
						});
					}
					//console.log(photos);
					mapillaryPhotoLayer.add(photos).addTo(map);

					$scope.mapControllerData.mapillaryPhotosShown = true;
				});
			});
		}
		else if (mapillaryPhotoLayer != null) {
			leafletData.getMap().then(function(map) {
				map.removeLayer(mapillaryPhotoLayer);
				$scope.mapControllerData.mapillaryPhotosShown = false;
			});
		}
	});

	$scope.$on("$ionicView.enter", function(event, data){
   	// handle event
   	//console.log(event);
		//console.log(data);

		$scope.updatePhotoMapLayer();

		$scope.updateWheelmapLayer();

		//$scope.updateWikiLayers();
	});

	// var markerEvents = leafletMarkerEvents.getAvailableEvents();
  // for (var k in markerEvents){
  //   var eventName = 'leafletDirectiveMarker.wikiosmmap.' + markerEvents[k];
	// 	console.log(eventName);
  //   //$scope.$on(eventName, function(event, args) {
  //   //    console.log(event.name);
  //   //});
  // }

	// var mapEvents = leafletMapEvents.getAvailableMapEvents();
  // for (var k in mapEvents){
  //     var eventName = 'leafletDirectiveMap.wikiosmmap.' + mapEvents[k];
	// 		console.log(eventName);
  //     $scope.$on(eventName, function(event, args) {
  //         console.log(event.name);
  //     });
  // }

	$scope.$on('leafletDirectiveMap.wikiosmmap.moveend', function(event, args) {
		//console.log(event.name);
		//console.log(args);
		//$scope.updateWikiLayers();
	});

	$scope.$on('leafletDirectiveMarker.wikiosmmap.click', function(event, args) {
			//console.log(event.name);
			console.log(args);
			if (args.model != undefined) {
				//console.log("evt.model != undefined");
				//$scope.selectedMapMarker = args;

				// TODO: 1. Wiki.queryMediaWiki,
				// 2. populate WikiDetailCtrl $scope data,
				// 2.1. include maplink and mapframe as suggested additions to the page and
				// 3. show wiki-detail page

				//tab.wiki-detail

				if (args.modelName.includes("wikipedia")) {
					$state.go("tab.wiki-detail", { wikiId: AppSettings.getDefaultLanguage() + "wikipedia+" + args.model.wikipediaItem.title, coordinates: "" + args.model.lat + "|" + args.model.lng});
				}
				else if (args.modelName.includes("wikidata")) {
					var qURLparts = args.model.wikidataItem.q.value.split("/");
					$state.go("tab.wiki-detail", { wikiId: AppSettings.getDefaultLanguage() + "wikidata+" + qURLparts[qURLparts.length-1], coordinates: "" + args.model.lat + "|" + args.model.lng});
				}
				else if (args.modelName.includes("commons")) {
					$state.go("tab.wiki-detail", { wikiId: AppSettings.getDefaultLanguage() + "commons+" + args.model.commonsItem.title, coordinates: "" + args.model.lat + "|" + args.model.lng});
				}

				//Wiki.createWikiPage("testorienteerix", "hello", "world", function(response) {
				//	console.log(response);
				//});

			}
			//$state.go("tab.photo-detail", { photoID: args.model.photoID });
	});

	//
	// Methods
	//

	// var photoIcon = {
  // 	iconUrl: 'img/icons/camera.png',
  //   iconSize: [32, 32],
  //   iconAnchor: [16, 16]
  // };

	$scope.updateWikiLayers = function() {
		if (!$scope.mapControllerData.WikiItemsShown) {
			if (AppSettings.shouldShowWikidataOnMap()) {
				leafletData.getMap().then(function(map) {
					var bounds = map.getBounds();
					Wiki.geoQueryWikidata(bounds.getSouthWest(), bounds.getNorthEast(), function(data) {
						console.log(data);

						var items = data.results.bindings;
						var markers = {};

						var wikidataIcon = {
							iconUrl: 'img/wikidata_no_text.png',
							iconSize: [32, 23],
							iconAnchor: [16, 12]
						}

						for (var i = 0; i < items.length; i++) {
							var locationParts = items[i].location.value.split("(")[1].split(")")[0].split(" ");

					    markers["wikidata"+i] = {
					      lat: parseFloat(locationParts[1]),
					      lng: parseFloat(locationParts[0]),
					      draggable: false,
								icon: wikidataIcon,
								wikidataItem: items[i]
								//message: "<div ng-include src=\"'templates/wikidata-map-item-template.html'\"></div>",
								//message: items[i].qLabel.value,
					    };
						}
						console.log(markers);

						Wiki.geoQueryWikipedia(bounds.getSouthWest(), bounds.getNorthEast(), function(data) {
							console.log(data);

							var items = data.query.geosearch;

							var wikipediaIcon = {
								iconUrl: 'img/wikipedia_no_text.png',
								iconSize: [32, 27],
								iconAnchor: [16, 14]
							}

							for (var i = 0; i < items.length; i++) {
						    markers["wikipedia"+i] = {
						      lat: parseFloat(items[i].lat),
						      lng: parseFloat(items[i].lon),
						      draggable: false,
									icon: wikipediaIcon,
									wikipediaItem: items[i]
									//message: "<div ng-include src=\"'templates/wikidata-map-item-template.html'\"></div>",
									//message: items[i].qLabel.value,
						    };
							}

							Wiki.geoQueryCommons(bounds.getSouthWest(), bounds.getNorthEast(), function(data) {
								console.log(data);

								var items = data.query.geosearch;

								var commonsIcon = {
									iconUrl: 'img/commons.png',
									iconSize: [25, 32],
									iconAnchor: [12, 16]
								}

								for (var i = 0; i < items.length; i++) {
							    markers["commons"+i] = {
							      lat: parseFloat(items[i].lat),
							      lng: parseFloat(items[i].lon),
							      draggable: false,
										icon: commonsIcon,
										commonsItem: items[i]
										//message: "<div ng-include src=\"'templates/wikidata-map-item-template.html'\"></div>",
										//message: items[i].qLabel.value,
							    };
								}

								angular.extend($scope, {
									markers: markers
								});

								$scope.mapControllerData.WikiItemsShown = true;
							});
						});
					});
				});
			}
			else {
				angular.extend($scope, {
					markers: {}
				});
			}
			// if (AppSettings.shouldShowWikipediaOnMap()) {
			// }
			// else {
			// 	// TODO
			// }
			// if (AppSettings.shouldShowCommonsOnMap()) {
			// 	// TODO
			// }
			// else {
			// 	// TODO
			// }
		}
		else {
			angular.extend($scope, {
				markers: {}
			});
			$scope.mapControllerData.WikiItemsShown = false;
		}
	}

	$scope.updateWheelmapLayer = function() {
		if (AppSettings.shouldShowWheelmapNodesOnMap()) {

			leafletData.getMap().then(function(map) {
				var bounds = map.getBounds();
				var bbox = {
					min_lng: bounds.getWest(),
					min_lat: bounds.getSouth(),
					max_lng: bounds.getEast(),
					max_lat: bounds.getNorth()
				}
				//console.log(bbox);

				Wheelmap.getNodes(bbox, "yes", AppSettings.getWheelmapNodesMaxCount(), 1, function(data) {
					console.log(data);
				});
			});
		}
		else if (wheelmapLayer != null){
			// angular.extend($scope, {
			// 	markers: {}
			// });

			leafletData.getMap().then(function(map) {
				map.removeLayer(wheelmapLayer);
			});
		}
	}

	$scope.updatePhotoMapLayer = function() {
		if (AppSettings.shouldShowUserPhotos()) {

			leafletData.getMap().then(function(map) {
				var gallery = PhotoGallery.getGallery();
       	//console.log(gallery);

				photoLayer = L.photo.cluster().on('click', function (evt) {
					// var photo = evt.layer.photo,
					// 	template = '<img src="{url}"/></a><p>{caption}</p>';
					//
					console.log(evt);
					// 	evt.layer.bindPopup(L.Util.template(template, photo), {
					// 		className: 'leaflet-popup-photo',
					// 		minWidth: 400
					// 	}).openPopup();

					if (evt.layer != undefined) {
						$state.go("tab.photo-detail", { source: "camera", photoID: evt.layer.photo.photoID });
					}
				});

				//console.log(map);
				var gallery = PhotoGallery.getGallery();
				var photos = [];

				// TODO show photos on the map if in view
				for (var i = 0; i < gallery.photos.length; i++) {
					var urlParts = gallery.photos[i].photoURL.split("/");
					photos.push({
								lat: gallery.photos[i].location.coords.latitude,
								lng: gallery.photos[i].location.coords.longitude,
								url: gallery.photos[i].photoURL,
								caption: urlParts[urlParts.length-1],
								thumbnail: gallery.photos[i].photoURL,
								photoID: gallery.photos[i].photoID
					});
				}
				//console.log(photos);
				photoLayer.add(photos).addTo(map);
			});
		}
		else if (photoLayer != null){
			// angular.extend($scope, {
			// 	markers: {}
			// });

			leafletData.getMap().then(function(map) {
				map.removeLayer(photoLayer);
			});
		}
	}

	$scope.goTo = function() {
		$scope.center  = {
			  lat : 61.5,
			  lng : 23.766667,
			  zoom : 12
			};
	}

	//$scope.goTo();

	$scope.locateMe = function() {
		console.log("in locateMe");
		//$scope.tiles = tilesDict.openstreetmap;
		$scope.locate();
	}

	$scope.locate = function(){
		console.log("in locate");
		$cordovaGeolocation
		  .getCurrentPosition()
		  .then(function (position) {
				console.log(position);
				console.log($scope);
		    $scope.center.lat = position.coords.latitude;
		    $scope.center.lng = position.coords.longitude;
		    $scope.center.zoom = 18;

				var markers = {};
		    markers.now = {
		      lat:position.coords.latitude,
		      lng:position.coords.longitude,
		      //message: "You Are Here",
		      focus: true,
		      draggable: false
		    };

				angular.extend($scope, {
				 	markers: markers
				});

		  }, function(err) {
		    // error
		    console.log("Location error!");
		    console.log(err);
		  });
	};

	$scope.findOSMObjects = function() {
		console.log("in findOSMObjects");
		var onEachFeature = function (feature, layer) {
			layer.on({
        click: function() {
          //console.log("geojson feature clicked");
					// var title = feature.properties.type.charAt(0).toUpperCase() +
					// 	feature.properties.type.slice(1) + " " +
					// 	feature.properties.id;
					//console.log(feature);
					//console.log($scope);
					$scope.mapControllerData.selectedFeature = feature;
					//console.log($scope);
					$scope.osmObjectInfo.id = feature.properties.id;
					$scope.osmObjectInfo.type = feature.properties.type;
					$scope.osmObjectInfo.tags = {};
					$scope.osmObjectInfo.wikidataTag = null;
					$scope.osmObjectInfo.wikipediaTag = null;
					$scope.osmObjectInfo.wikimediaCommonsTag = null;
					for (var key in feature.properties.tags) {
						if (key == "wikipedia") {
							$scope.osmObjectInfo.wikipediaTag = feature.properties.tags[key];
							Wiki.getItemWithCoordinates("wikipedia", feature.properties.tags[key], function (item) {
									$scope.osmObjectInfo.wikipediaItem = item;
					    });
						}
						else if (key == "wikidata") {
							$scope.osmObjectInfo.wikidataTag = feature.properties.tags[key];
							Wiki.getItemWithCoordinates("wikidata", feature.properties.tags[key], function (item) {
					        $scope.osmObjectInfo.wikidataItem = item;
					    });
						}
						else if (key == "wikimedia_commons") {
							$scope.osmObjectInfo.wikimediaCommonsTag = feature.properties.tags[key];
							Wiki.getItemWithCoordinates("commons", feature.properties.tags[key], function (item) {
									$scope.osmObjectInfo.wikimediaCommonsItem = item;
							});
						}
						else {
							$scope.osmObjectInfo.tags[key] = feature.properties.tags[key];
						}
					}
					//$scope.osmObjectInfo.tags = feature.properties.tags;
					$scope.osmObjectInfo.incompleteGeometry = feature.properties.tainted;

					$scope.mapControllerData.changesToSave = false; // TODO could ask saving previous changes before selecting this new feature...
					$scope.$apply();
					// TODO populate Wiki search form with the data
					$ionicSideMenuDelegate.toggleRight(true);
				}
			});
		}

		var styleFeature = function (feature) {

			var style = {};

			if (feature.properties.type == "way") {
				if (feature.properties.tags != undefined) {
					if (feature.properties.tags.wikipedia != undefined) {
						style.color = osmColors.wiki;
						console.log(style);
					}
					else if (feature.properties.tags.building != undefined) {
						style.color = osmColors.building;
					}
					else if ((feature.properties.tags.leisure != undefined && feature.properties.tags.leisure == "park") ||
						(feature.properties.tags.leisure != undefined && feature.properties.tags.leisure == "playground") ||
						(feature.properties.tags.landuse != undefined && feature.properties.tags.landuse == "grass")
						) {
						style.color = osmColors.leisure;
					}
					else if (feature.properties.tags.highway != undefined ||
						(feature.properties.tags.amenity != undefined && feature.properties.tags.amenity == "parking")
						) {
						style.color = osmColors.highway;
					}
					else {
						style.color = osmColors.unspecified_way;
					}
				}
				if (feature.properties.tainted) {
					style.dashArray = "5, 5";
					//console.log(style);
				}
			}

			return style;
		}

		var pointToLayer = function (feature, latlng) {

			var geojsonMarkerOptions = {
			    radius: 12,
			    fillColor: osmColors.nodes,
			    color: "#000",
			    weight: 1,
			    opacity: 1,
			    fillOpacity: 0.4
			};

			if (feature.properties.tags != undefined) {
				if (feature.properties.tags.wikipedia != undefined) {
					geojsonMarkerOptions.fillColor = osmColors.wiki;
				}
			}

			return L.circleMarker(latlng, geojsonMarkerOptions);
		}

		var addOverpassDataToMap = function(data) {

			$scope.mapControllerData.OSMElementsShown = true;

			var geoJson = osmtogeojson(data);
			console.log(geoJson);

			leafletData.getMap().then(function(map) {
				osmGeoJsonLayer = L.geoJson(geoJson, {
					style: styleFeature,
					pointToLayer: pointToLayer,
					onEachFeature: onEachFeature
				}).addTo(map);
			});
		}

		if (!$scope.mapControllerData.OSMElementsShown) {
			addOverpassDataToMap(overpass_test_data);
		}
		else {
			leafletData.getMap().then(function(map) {
				map.removeLayer(osmGeoJsonLayer);
				$scope.mapControllerData.OSMElementsShown = false;
			});
		}

		// data = "[out:json];(node(around:" + AppSettings.getOSMSearchRadius() + "," + $scope.center.lat + "," + $scope.center.lng + ");<;);out meta;";
		// $http.get('http://www.overpass-api.de/api/interpreter?data=' + data)
		// 	.success(function(data, status, headers,config){
		//       console.log('data success');
		//       //console.log(data); // for browser console
		//       //$scope.mapControllerData.overpassResult = data; // for UI
		//
		//       addOverpassDataToMap(data);
		//     })
		//     .error(function(data, status, headers,config){
		//       console.log('data error');
		//     })
		//     .then(function(result){
		//       //things = result.data;
		//     });

		// (node(around:100.0,61.496507,23.781377);<;);out meta; // sorsapuisto
		// (node(around:100.0,61.5,23.766667);<;);out meta; // koskipuisto
	}

});
