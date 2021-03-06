/* global jQuery:false */
/* global Mustache:false */

var AdvancedSettingsView = (function($) {
	"use strict";

	function getSettingInfo(id) {
		var obj = $("#settings-row-" + id);
		return {
			category: obj.attr("data-category"),
			level: obj.attr("data-level"),
			key: obj.attr("data-key"),
			value: $(".advanced-setting-value-text", obj).html()
		};
	}

	function sortCategoryKeys(category) {
		$(".settings-" + category + " > div").sort(function(a,b) {
			var keyA = $(a).attr("data-key").toLowerCase();
			var keyB = $(b).attr("data-key").toLowerCase();
			return (keyA > keyB) ? 1 : (keyA < keyB ? -1 : 0);
		}).appendTo(".settings-" + category);
	}

	function showAdd(category) {
		Modal.create({
			title: Locale.str("advancedsettings", "action_add"),
			btn_action: Locale.str("system", "action_add"),
			oncreated: function(modalId) {
				var template = $("#template-advancedsettings-add").html();
				var data = { "category": category, "datatypes": ["String", "Number", "Boolean"] };
				var html = Mustache.render(template, data);
				$(".modal-body", "#" + modalId).html(html);
			},
			onsubmitted: function(modalId, data) {
				var template = $("#template-advancedsettings-row").html();
				data.is_public = (data.level === "public");
				data.is_protected = (data.level === "protected");
				data.is_private = (data.level === "private");
				var html = Mustache.render(template, data);
				$(".settings-" + category).append(html);
				sortCategoryKeys(category);
				$("#" + modalId).modal("hide");
			}
		});
	}

	function showEdit(id) {
		var obj = $("#settings-row-" + id);
		$(".advanced-settings-value-text, .settings-edit-btn, .settings-delete-btn", obj).addClass("hidden");
		$(".advanced-settings-input, .advanced-settings-input, .settings-save-btn, .settings-cancel-btn", obj).removeClass("hidden");
		$("input, select", "#settings-row-" + id).val($(".advanced-settings-value-text", obj).html());
		obj.on("submit", function() {
			edit(id);
			return false;
		});
	}

	function edit(id) {
		var obj = $("#settings-row-" + id);
		var info = getSettingInfo(id);
		var newValue = $("input, select", "#settings-row-" + id).val();
		var url = "__api__/settings/" + info.category + "/" + info.key + "?_method=put";
		url += "&value=" + encodeURIComponent(newValue);
		$.getJSON(url, function () {
			$(".advanced-settings-value-text", obj).html(newValue);
			hideEdit(id);
		});
	}

	function hideEdit(id) {
		$(".advanced-settings-input, .settings-save-btn, .settings-cancel-btn", "#settings-row-" + id).addClass("hidden");
		$(".advanced-settings-value-text, .settings-edit-btn, .settings-delete-btn", "#settings-row-" + id).removeClass("hidden");
	}

	function showDelete(id) {
		var data = getSettingInfo(id);
		Modal.create({
			title: Locale.str("advancedsettings", "action_delete"),
			btn_action: Locale.str("system", "action_delete"),
			btn_class: "btn-danger",
			oncreated: function(modalId) {
				var template = $("#template-advancedsettings-delete").html();
				$(".modal-body", "#" + modalId).html(Mustache.render(template, data));
			},
			onsubmitted: function(modalId, data) {
				$("#" + modalId).modal("hide");
				$("#settings-row-" + id).remove();
			}
		});
	}

	return {
		sortCategoryKeys: sortCategoryKeys,
		showAdd: showAdd,
		showEdit: showEdit,
		edit: edit,
		hideEdit: hideEdit,
		showDelete: showDelete
	};

})(jQuery);