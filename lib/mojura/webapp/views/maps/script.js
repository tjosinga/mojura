var MapsView = (function($) {

	'use strict';

	var maps = {};

	function initMap(mapId, options) {
		options.initLat = options.initLat || 0;
		options.initLng = options.initLng || 0;
		options.initZoom = options.initZoom || 0;
		options.category = options.category || "";
		options.showAdmin = (options.showAdmin === true);
		options.scrollWheelZoom = (options.scrollWheelZoom !== false);

		maps[mapId] = options;
		maps[mapId].markers = [];

		maps[mapId].map = L.map(mapId).setView([options.initLat, options.initLng], options.initZoom);
		options.tileUrl = options.tileUrl || 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
		options.tileAttribution = options.tileAttribution || '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>';
		L.tileLayer(options.tileUrl, {
			attribution: options.tileAttribution
		}).addTo(maps[mapId].map);

		if (options.showAdmin) {
			maps[mapId].map.on('click', onMapClick);
		}

		if (!options.scrollWheelZoom) {
			maps[mapId].map.scrollWheelZoom.disable();
		}
	}

	function onMapClick(e) {
		if (e.originalEvent.altKey) {
			var mapId = $(e.originalEvent.target).parents(".leaflet-map").attr("id");
			addEditLocation(mapId, "new", e.latlng);
		}
	}

	function loadLocations(mapId, zoomFactor) {
		// Removes existing markers.
		while (maps[mapId].markers.length > 0) {
			var marker = maps[mapId].markers.pop();
			maps[mapId].map.removeLayer(marker);
		}

		var url = "__api__/locations";
		if (maps[mapId].category !== "") {
			url += "?category=" + encodeURIComponent(category);
		}
		$.getJSON(url, function(locations) {
			if (typeof locations !== "undefined") {
				for (var i in locations) {
					addMarker(mapId, locations[i]);
				}
				(zoomFactor >= 0) ? centerOnMarkers(mapId, zoomFactor) : autoZoom(mapId);
				$(".leaflet-popup-pane script", "#" + mapId).each(function(index) {
					eval($(this).text());
				});
			}
		});
	}

	function addMarker(mapId, location) {
		if (maps[mapId] === undefined) {
			window.console.log("MapsView.addLocation: Unknown mapId");
			return;
		}
		var marker = L.marker([location.latitude, location.longitude], {draggable: maps[mapId].showAdmin}).addTo(maps[mapId].map);
		var html = "<h5>" + location.title + "</h5>" + location.description.html;
		if (maps[mapId].showAdmin) {
			var adminBtns = "<div class='btn-group btn-group-xs'>";
			adminBtns += "<button type='button' class='btn btn-default' onclick='MapsView.editLocation(\"" + mapId + "\", \"" + location.id + "\")'><i class='fa fa-pencil'></i></button>";
			adminBtns += "<button type='button' class='btn btn-default' onclick='MapsView.deleteLocation(\"" + mapId + "\", \"" + location.id + "\")'><i class='fa fa-trash-o'></i></button>";
			adminBtns += "</div>";
			html = adminBtns + html;
		}
		marker.bindPopup(html);

		marker.on('dragend', function(e) {
			var latLng = marker.getLatLng()
			var url = "__api__/locations/" + location.id + "?_method=put&";
			url += "address=" + latLng.lat + "," + latLng.lng;
			marker.setOpacity(0.5);
			$.getJSON(url, function(data) {
				marker.setOpacity(1.0);
			});
		});
		maps[mapId].markers.push(marker);
	}

	function autoZoom(mapId) {
		if (maps[mapId] === undefined) {
			window.console.log("MapsView.addLocation: Unknown mapId");
			return;
		}
		var group = new L.featureGroup(maps[mapId].markers);
		maps[mapId].map.fitBounds(group.getBounds().pad(0.2));
	}

	function centerOnMarkers(mapId, zoomFactor) {
		if (maps[mapId] === undefined) {
			window.console.log("MapsView.addLocation: Unknown mapId");
			return;
		}
		var group = new L.featureGroup(maps[mapId].markers);
		maps[mapId].map.setZoom(zoomFactor);
		maps[mapId].map.panTo(group.getBounds().getCenter());
	}

	function addLocation(mapId) {
		addEditLocation(mapId, "new");
	}

	function editLocation(mapId, locationid) {
		addEditLocation(mapId, locationid);
	}

	function addEditLocation(mapId, locationid, latLng) {
		Modal.create({
			id: "mapsAddEditModal",
			modal_large: true,
			title: Locale.str('maps', (locationid === "new") ? "add" : "edit"),
			oncreated: function(modalId, onLoaded) {
				$("#" + modalId).modal("show");
				var url = "__api__/locations/" + locationid;
				$.getJSON(url, function(data, textStatus, response) {
					var template = $("#template-maps-addedit").html();
					data = $.extend({}, data, Locale.getViewsStrings(["system", "maps"]));
					data.method = (locationid === "new") ? "post" : "put";
					if (locationid === "new") {
						data.category = maps[mapId].category;
						if (typeof latLng !== "undefined") {
							data.latitude = latLng.lat;
							data.longitude = latLng.lng;
						}
					}
					data.locationid = locationid;
					data.urid = UIDGenerator.get();
					var partials = {
						"locales-selection": $("#template-locales-selection").html()
					};
					var supportedLanguages = response.getResponseHeader("Mojura-Supported-Languages");
					data.supported_locales =  (typeof supportedLanguages === "string") ? supportedLanguages.split(", ") : [];
					data.is_multilingual = (data.supported_locales.length > 1);

					var html = Mustache.render(template, data, partials);
					$(".modal-body", "#" + modalId).html(html);
					onLoaded();
				});
				return true;
			},
			onerror: function(modalId, errorCode) {
				if (errorCode == 412) {
					$(".alert-address-not-found").removeClass("hidden");
				}
			},
			onsubmitted: function(modalId, data) {
				loadLocations(mapId, -1);
			}
		});
	}

	function deleteLocation(mapId, locationid) {
		Modal.create({
			id: "mapsDeleteModal",
			btn_class: "btn-danger",
			btn_action: Locale.str("system", "delete"),
			title: Locale.str("maps", "delete"),
			oncreated: function(modalId) {
				$("#" + modalId).modal("show");
				var template = $("#template-maps-delete").html();
				var data = Locale.getViewsStrings(["system", "maps"]);
				data.locationid = locationid;
				data.urid = UIDGenerator.get();
				var html = Mustache.render(template, data);
				$(".modal-body", "#" + modalId).html(html);
			},
			onsubmitted: function(modalId, data) {
				loadLocations(mapId, maps[mapId].map.getZoom());
			}
		});
	}

	function getMap(mapId) {
		return maps[mapId].map;
	}

	return {
		initMap: initMap,
		loadLocations: loadLocations,
		addMarker: addMarker,
		addLocation: addLocation,
		editLocation: editLocation,
		deleteLocation: deleteLocation,
		getMap: getMap
	};

})(jQuery);