/* global jQuery:false */
/* global Mustache:false */


var FilesView = (function ($) {
	"use strict";

	var uploading = false;

	var currentFolderId = "root";
	var previousFolderId = "root";

	function setCurrentFolderId(id, silent) {
		if (currentFolderId !== id) {
			previousFolderId = currentFolderId;
			currentFolderId = id;
			if (!silent) {
				refresh();
			}
		}
	}

	function getSettings() {
		var jSettings = $(".files-settings", "#files_folders_container");
		var settings = jSettings.data();
		return settings;
	}

	function refresh() {
		//should only refresh the files/folders list!!! Just a workaround.
		var settings = getSettings();
		$("#files_folders_container").html("<div class='loading'></div>");
		var id = currentFolderId;
		id = ((id !== "") && (typeof id !== "undefined")) ? "root" : id;
		var url = "__api__/files/folder/" + id;

		$.getJSON(url, function (data) {
			var template = $("#template_files_folders_container").html();
			$.extend(data, settings);
			data.may_maintain = (data.rights.allowed.update);
			data.is_base_folder = (data.id === undefined) || (data.id === settings.root_folderid);
			data.has_subfolders = (data.subfolders.length > 0);
			data.has_files = (data.files.length > 0);
			for (var i = 0; i < data.files.length; i++) {
				//noinspection JSUnresolvedVariable
				data.files[i].is_image = (data.files[i].mime_type !== undefined) && (data.files[i].mime_type.slice(0, 5) === "image");
				//noinspection JSUnresolvedVariable
				data.files[i].is_archive = (data.files[i].mime_type !== undefined) && (data.files[i].mime_type === "application/zip");
			}
			var html = Mustache.to_html(template, data);
			if (history.pushState) {
				var new_location = window.location.toString();
				new_location = new_location.replace(/\?folderid=\w+/, "");
				if ((data.id !== undefined) && (data.id !== null)) {
					new_location += "?folderid=" + data.id;
				}
				history.pushState({}, document.title, new_location);
			}
			$("#files_folders_container").html(html);
		});
	}

	function loadForm(modalId, templateId, url, method) {
		var id = currentFolderId;
		id = ((id !== "") || (typeof id !== "undefined")) ? "root" : id;
		$(".btn-primary, .btn-danger", modalId).button("reset");
		$(".modal-body", modalId).html("<div class='loading'></div>");
		$.getJSON(url, function (data) {
			if (data.id === null) {
				data.id = "";
			}
			var template = $(templateId).html();
			var html = Mustache.to_html(template, data);
			$(".modal-body", modalId).html(html);
			var options = {
				success: function () {
					$(modalId).modal("hide");
					FilesView.refresh();
				}
			};
			$("form", modalId).ajaxForm(options);
			$("input[name=_method]", modalId).val(method);
			$("input[name=folderid], input[name=parentid]", modalId).val(id);
		});
	}


	return {
		setCurrentFolderId: setCurrentFolderId,
		refresh: refresh,
		loadForm: loadForm
	};

})(jQuery);