/* This file is generated with Mojura's tool 'combine_js'.
   It combines all JavaScript files which are stored in lib/mojura/webapp/mojura/js/sources/.*/

/* kvparser.js */

var KeyValueParser = (function () {
	"use strict";

	var lastResult;

	function parse(str, options) {
		options = (typeof options !== 'undefined') ? options : {};
		options.sep_char = (typeof options.sep_char !== 'undefined') ? options.sep_char : "=";
		options.trim_values = (typeof options.trim_values !== 'undefined') ? options.trim_values : true;
		options.comment_char = (typeof options.comment_char !== 'undefined') ? options.comment_char : "#";

		var result = {};
		var lines = str.match(/[^\r\n]+/g);
		for (var i in lines) {
			if (lines.hasOwnProperty(i)) {
				var line = lines[i].replace(/^\s+|\s+$/g);
				if ((line !== "") && (line[0] !== options.comment_char)) {
					var arr = line.split(options.sep_char, 2);
					var key = arr[0].toString().replace(/^\s+|\s+$/g, ""); //toString() to please the IDE
					var value = arr[1];
					if (options.trim_values) {
						value = value.replace(/^\s+|\s+$/g, "");
					}
					result[key] = value;
				}
			}
		}

		lastResult = result;
		return result;
	}

	function toString() {
		var result = "";
		if (typeof lastResult !== 'undefined') {
			for (var key in lastResult) {
				if (lastResult.hasOwnProperty(key)) {
					result += key + ": " + lastResult[key] + "\n";
				}
			}
		}
		return result;
	}

	return { parse: parse, toString: toString };

})();


/* locale.js */

/* global KeyValueParser:false */
/* global jQuery:false */

var Locale = (function($) {
	"use strict";

	var locale = "";
	var strings = {};

	function init(lc) {
		locale = lc;
	}

	function ensureLoaded(view, options) {
		if (typeof strings[view] === 'undefined') {
			load(view, options);
		}
		else if ((typeof options !== 'undefined') && (typeof options.loaded !== 'undefined')) {
			options.loaded();
		}
	}

	function load(view, options) {
		if (locale === "") {
			window.alert("You should initialize the locale object with Locale.init(\"en\"), where \"en\" is the used locale.");
			return;
		}
		if (typeof view === "undefined") {
			throw "The view needs to be set calling Locale.load(view, [options = {}])";
		}
		var url = "views/" + view + "/strings." + locale + ".kv";
		$.ajax({
			url: url,
			fail: function () {
				window.console.log("Error fetching " + url);
				if (typeof options.error !== 'undefined') {
					options.error();
				}
			},
			success: function (data) {
				try {
					strings[view] = KeyValueParser.parse(data);
					if ((typeof options !== 'undefined') && (typeof options.loaded !== 'undefined')) {
						options.loaded();
					}
				}
				catch (error) {
					window.console.log("Error on parsing " + url + ": " + error.message);
					strings[view] = {};
					if (typeof options.error !== 'undefined') {
						options.error();
					}
				}
			}
		});
	}

	function add(view, id, str) {
		if (typeof strings.view === 'undefined') {
			strings.view = {};
		}
		strings.view.id = str;
	}


	function str(view, id) {
		if ((typeof strings[view] !== 'undefined') && (typeof strings[view][id] !== 'undefined')) {
			return strings[view][id];
		}
		else {
			return "__" + view + "_" + id + "__";
		}
	}

	function rawStrings(views) {
		var result = {};
		$.each(views, function(index, view) {
			if (typeof strings[view] !== 'undefined') {
				$.each(strings[view], function(id, str) {
					result["locale_str_" + view + "_" + id] = str;
				});
			}
		});
		return result;
	}

	return {
		init: init,
		ensureLoaded: ensureLoaded,
		add: add,
		str: str,
		rawStrings: rawStrings
	};

})(jQuery);


/* modal.js */

var Modal = (function($) {
	"use strict";

	var idCounter = 0;

	function create(options, onshow) {
		var template = $("#modal_template").html();
		if (typeof options.id !== "undefined") {
			$("#" + options.id).remove(); // Removes the modal if it already exists
		} else {
			options.id = "modal_" + idCounter++;
		}
		options.btn_title = (typeof options.btn_title !== "undefined") ? options.btn_title : Locale.str("system", "save");

		var html = Mustache.render(template, options);
		$("body").appendChild(html);
		if (typeof onshow !== "undefined") {
			onshow(options.id);
		}
	}

	return {
		create: create
	};

})(jQuery);


/* pageeditor.js */

/* global jQuery:false */
/* global Mustache:false */
/* global Locale:false */
/* global UIDGenerator:false */

var PageEditor = (function ($) {
	"use strict";

	function togglePageAdmins() {
		$(".btn-edit-page").toggleClass("hidden");
		$(".view-admin").toggleClass("hidden").parent().toggleClass("editable");

		var url = window.location.toString().replace(/#editing/, "");
		if ($(".btn-edit-page").is(":visible")) {
			url += "#editing";
		}

		history.pushState({}, document.title, url);
	}

	function showEditPage() {
		$("#modalEditPage").modal("show");
		var old_title = $("input[name=title]", "#modalEditPage").val();
		$("form", "#modalEditPage").on("submit", function () {

			$(this).ajaxSubmit({success: function () {

				var new_title = $("input[name=title]", "#modalEditPage").val();
				if (new_title !== old_title) {
					var pattern_old_title = encodeURIComponent(old_title).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
					var reg = new RegExp(pattern_old_title + "#", "g");
					var url = document.location.toString().replace(reg, encodeURIComponent(new_title) + "#");
					history.pushState({}, document.title, url);
				}
				$("#modalEditPage").modal("hide");
				location.reload();
			}, error: function (request, errordata, errorObject) {
				window.alert(errorObject.toString());
			}});
		});
	}

	function showDeletePage() {
		var pageid = $("input[name=pageid]", "#modalDeletePage").val();
		var url = "__api__/pages/" + pageid;
		$("form", "#modalDeletePage").submit(function (form) {
			$.getJSON(url + "?_method=delete", function (data) {
				var url = document.location.toString();
				document.location = url.slice(0, url.lastIndexOf("/"));
				$("#modalDeletePage").modal("hide");
			});
			return false;
		});
		$("#modalDeletePage").modal("show");
	}

	function showAddSubpage() {
		var pageid = $("input[name=pageid]", "#modalDeletePage").val();
		var html = $("#modalEditPage form").html();
		$("#modalAddSubpage form .elements").html(html);
		$("#modalAddSubpage form input[name=title]").val("");
		$("#modalAddSubpage").modal("show");
		$("form", "#modalAddSubpage").on("submit", function () {
			$(this).ajaxSubmit({success: function () {
				var title = $("input[name=title]", "#modalAddSubpage").val();
				var url = document.location.toString();
				url = url.slice(0, url.indexOf("#"));
				url += "/" + encodeURIComponent(title) + "#editing";
				$("#modalAddSubpage").modal("hide");
				document.location = url;
			}, error: function (request, errordata, errorObject) {
				window.alert(errorObject.toString());
			}});
		});
	}


	function getViewIdFromView(viewObj) {
		var result = "";
		$(viewObj).parents(".view").each(function (index, obj) {
			result = $(obj).index().toString() + "," + result;
		});
		return result + $(viewObj).index();
	}

	function setEditViewData(data) {
		$("input[name=viewid]", "#modalEditView").val(data.viewid);
		$("textarea[name=content]", "#modalEditView").val(data.content.raw);
		$("select[name=view]", "#modalEditView").change(function () {
			var view = $(this).val();
			if (view === "") {
				$(".view-settings", "#modalEditView").html("");
				return;
			}
			$(".view-settings", "#modalEditView").html("<div class='loading'></div>");
			Locale.ensureLoaded(view, { loaded: function() {
				var url = "views/" + view + "/coworkers/view_edit_settings.mustache?static_only=true";
				$.get(url, {cache: false},function (template) {
					var strs = Locale.rawStrings(["system", view]);
					data.urid = UIDGenerator.get();
					for (var id in strs) {
						if (strs.hasOwnProperty(id)) {
							data.settings[id] = strs[id];
						}
					}
					var html = Mustache.to_html(template, data.settings);
					$(".view-settings", "#modalEditView").html(html);
				}).error(function () {
					$(".view-settings", "#modalEditView").html("");
				});
			}});
		}).val(data.view).trigger("change");
		$("select[name=col_span]", "#modalEditView").val(data.col_span);
		$("select[name=col_offset]", "#modalEditView").val(data.col_offset);
		$("select[name=row_offset]", "#modalEditView").val(data.row_offset);
		$("input[name=setting_classes]", "#modalEditView").val(data.settings.classes);
		$("select[name=view] option", "#modalEditView").removeAttr("disabled");

		if (data.col_span < 12) {
			var min_col_spans = [];
			//noinspection JSUnresolvedVariable
			for (var i = 12; i > data.col_span; i--) {
				min_col_spans.push(".min-col-span" + i);
			}
			$(min_col_spans.join(",")).attr("disabled", "disabled");
		}
	}

	function showEditView(viewObj) {
		$(".loading", "#modalEditView").show();
		$("form", "#modalEditView").hide();
		var viewid = getViewIdFromView(viewObj);
		var pageid = $("input[name=pageid]", "#modalEditView").val();
		var url = "__api__/pages/" + pageid + "/view/" + viewid;
		$.getJSON(url, function (data) {
			setEditViewData(data);
			$("#form_view_content .view_include_text input").prop("checked", (data.content.raw !== ""));
			$("#form_view_content .view_include_text").toggle(data.view !== "");
			$("#form_view_content .view_texteditor").toggle(data.content.raw !== "");
			$(".loading", "#modalEditView").hide();
			$("form", "#modalEditView").show();
		});

		var options = {
			success: function () {
				location.reload();
			}
		};
		$("form", "#modalEditView").attr("action", url).ajaxForm(options);
		$("#modalEditView").modal("show");
	}


	function showDeleteView(viewObj) {
		var viewid = getViewIdFromView(viewObj);
		var pageid = $("input[name=pageid]", "#modalDeleteView").val();
		var url = "__api__/pages/" + pageid + "/view/" + viewid;
		$("form", "#modalDeleteView").attr("action", url).submit(function (form) {
			$.getJSON(url + "?_method=delete", function (data) {
				$(viewObj).remove();
				$("#submitDeleteView").button("reset");
				$("#modalDeleteView").modal("hide");
			});
			return false;
		});
		$("#modalDeleteView").modal("show");
	}

	function checkVisibilityTextEditor() {
		var view = $("#form_view_content select").val();
		var checked = $("#form_view_content .view_include_text input").prop("checked");
		$("#form_view_content .view_include_text").toggle(view !== "");
//		$("#form_view_content .view_texteditor").toggle((view == "") || (checked));
	}

	function addSubview(pageid, templateid, path) {
		var url = "__api__/pages/" + pageid + "/views/?_method=put&template=" + templateid;
		if ((path !== undefined) && (path !== "")) {
			url += "&parentid=" + path;
		}
		$.getJSON(url, function (data) {
			location.reload();
		});
	}

	function submit(btn) {
		$(btn).button('loading');
		var jModal = $(btn).closest(".modal");
		if (jModal.attr("id") === "modalEditView") {
			var view = $("#form_view_content select[name=view]").val();
			var checked = $("#form_view_content .view_include_text input").prop("checked");
			if ((view !== "") && (!checked)) {
				$("#form_view_content .view_texteditor textarea").val("");
			}
		}
		jModal.one("hidden.bs.modal", function() {
			$('form', jModal).submit();
		});
		jModal.modal("hide");
	}



	return {
		togglePageAdmins: togglePageAdmins,
		showEditPage: showEditPage,
		showDeletePage: showDeletePage,
		showAddSubpage: showAddSubpage,
		showEditView: showEditView,
		showDeleteView: showDeleteView,
		checkVisibilityTextEditor: checkVisibilityTextEditor,
		addSubview: addSubview,
		submit: submit
	};


})(jQuery);


/* texteditor.js */

/* global jQuery:false */
/* global Validator:false */
/* global Locale:false */
/* global Mustache:false */
/* global SelectFile:false */

var TextEditor = (function($) {
	"use strict";

	function init(textareaSelector) {
		addToolbar(textareaSelector);
	}

	var newVar = {
		"bold": {"icon": "fa-bold", "method": function (text, os) { return executeActionSimple("b", text, os); }},
		//"underline": {"icon": "icon-underlined", "method": function (text) { return executeActionSimple("u", text, os) }},
		"italic": {"icon": "fa-italic", "method": function (text, os) { return executeActionSimple("i", text, os); }},
		"divider 1": "divider",
		"ol": {"icon": "fa-list-ol", "method": function (text, os) { return executeActionSimple("list", text, os, {addNewlines: true}); }},
		"ul": {"icon": "fa-list-ul", "method": function (text, os) { return executeActionSimple("bullets", text, os, {addNewlines: true}); }},
		"divider 2": "divider",
		"email": {"icon": "fa-envelope", "method": function (text, os) { return executeActionEmail(text, os); }},
		"url": {"icon": "fa-link", "method": function (text, os) { return executeActionUrl(text, os); }},
		"video": {"icon": "fa-film", "method": function (text, os) { return executeActionVideo(text, os); }},
		"divider 3": "divider",
		"img": {"icon": "fa-picture-o", "method": function (text, os) { return executeActionImage(text, os); }},
		"file": {"icon": "fa-file", "method": function (text, os) { return executeActionFile(text, os); }}
	};
	var buttons = newVar;

	function addToolbar(textareaSelector) {
		loadModals();

		var html = "<div class='texteditor_toolbar' data-selector='" + textareaSelector + "' style='padding-bottom: 10px;'>";
		html += "<div class='btn-group'>";
		$.each(buttons, function (index, object) {
			if (object === "divider") {
				html += "</div><div class='btn-group'>";
			}
			else {
				var icon = "<span class='fa " + object.icon + "'></span>";
				html += "<div class='btn btn-default' data-action='" + index + "'>" + icon + "</div>";
			}
		});
		html += "</div></div>"; //btn-group and texteditor_toolbar

		$(html).insertBefore(textareaSelector).find(".btn").on("click", function () {
//			textareaSelector = $(this).parents(".texteditor_toolbar").attr("data-selector");
			var action = $(this).attr("data-action");
			TextEditor.executeAction(textareaSelector, action);
		});

		$(textareaSelector).css("width", "100%");
	}

	function loadModals() {
		if ($("#texteditor_modals").length === 0) {
			var url = "mojura/views/texteditor_modals.mustache?static_only=true";
			$.get(url, {cache: false}, function (template) {
				var html = Mustache.to_html(template, Locale.rawStrings(["system"]));
				$("body").append("<div id='texteditor_modals'>" + html + "</div>");
			});
		}
	}

	function executeAction(textareaSelector, action) {
		buttons[action].method(getText(textareaSelector), function(text) {
			setText(textareaSelector, text);
		});
	}

	function getText(textareaSelector) {
		return $(textareaSelector).textrange("get", "text");
	}

	function setText(textareaSelector, selectedText) {
		$(textareaSelector).textrange("replace", selectedText);
	}

	function showModal(popupClass, onSuccess) {
		$("#modalEditView").removeClass("fade").one("hidden.bs.modal",function () {
			$("#texteditor_modals ." + popupClass).one("hidden.bs.modal",function () {
				$("#modalEditView").modal("show");
			}).one("shown.bs.modal",function () {
					$("#texteditor_modals ." + popupClass + " .btn-primary").one("click", function () {
						onSuccess();
					});
				}).modal("show");
		}).one("shown.bs.modal",function () {
				$("#modalEditView, .modal-backdrop").addClass("fade");
			}).modal("hide");
	}

	function executeActionSimple(tag, text, onSuccess, options) {
		if (options === undefined) {
			options = {};
		}
		if (options.addNewlines) {
			text = "\n" + text;
		}
		text = "[" + tag + "]" + text + "[/" + tag + "]";
		if (options.addNewlines) {
			text += "\n";
		}
		onSuccess(text);
	}

	function executeActionEmail(text, onSuccess) {
		var email = "";
		var visibleText = "";
		if (Validator.isEmail({value: text})) {
			email = text;
		}
		else {
			visibleText = text;
		}
		$(".texteditor-email-popup-modal input[name=email]").val(email);
		$(".texteditor-email-popup-modal input[name=visible_text]").val(visibleText);

		showModal("texteditor-email-popup-modal", function () {
			email = $(".texteditor-email-popup-modal input[name=email]").val();
			visibleText = $(".texteditor-email-popup-modal input[name=visible_text]").val();
			var ubb = (visibleText === "") ? email : "[email=" + email + "]" + visibleText + "[/email]";
			onSuccess(ubb);
		});
	}

	function executeActionUrl(text, onSuccess) {
		var url = "";
		var visibleText = "";
		if (Validator.isUrl({value: text})) {
			url = text;
		}
		else {
			visibleText = text;
		}
		$(".texteditor-url-popup-modal input[name=url]").val(url);
		$(".texteditor-url-popup-modal input[name=visible_text]").val(visibleText);

		showModal("texteditor-url-popup-modal", function () {
			url = $(".texteditor-url-popup-modal input[name=url]").val();
			visibleText = $(".texteditor-url-popup-modal input[name=visible_text]").val();
			var ubb = (visibleText === "") ? "[url]" + url + "[/url]" : "[url=" + url + "]" + visibleText + "[/url]";
			onSuccess(ubb);
		});
	}

	function executeActionVideo(text, onSuccess) {
		var url = (Validator.isUrl({value: text})) ? text : "";
		$(".texteditor-video-popup-modal input[name=url]").val(url);
		showModal("texteditor-video-popup-modal", function () {
			url = $(".texteditor-video-popup-modal input[name=url]").val();
			onSuccess("[video]" + url + "[/video]");
		});
	}


	function executeActionImage(text, onSuccess) {
		Locale.ensureLoaded('files', {loaded: function () {
			var url = "views/files/coworkers/select_file.mustache?static_only=true";
			$.get(url, {cache: true}, function (template) {
				var html = Mustache.to_html(template, Locale.rawStrings(["system", "files"]));
				$("body").append("<div id='texteditor_selectfile'></div>");
				$("#texteditor_selectfile").html(html);
				SelectFile.show({multi: false, parentModalId: "modalEditView",
					confirmed: function (ids) {
						onSuccess("[img]" + ids.join() + "[/img]");
					},
					hidden: function () {
						$("#texteditor_selectfile").remove();
					}
				});
			});
		}});
	}

	function executeActionFile(text, onSuccess) {
		Locale.ensureLoaded('files', {loaded: function () {
			var url = "views/files/coworkers/select_file.mustache?static_only=true";
			$.get(url, {cache: true}, function (template) {
				var html = Mustache.to_html(template, Locale.rawStrings(["system", "files"]));
				$("body").append("<div id='texteditor_selectfile'></div>");
				$("#texteditor_selectfile").html(html);
				SelectFile.show({multi: false, parentModalId: "modalEditView",
					confirmed: function (ids) {
						var fileId = ids.join();
						var name = SelectFile.getCachedFilename(fileId);
						onSuccess("[url=" + fileId + "]" + name + "[/url]");
					},
					hidden: function () {
						$("#texteditor_selectfile").remove();
					}
				});
			});
		}});
	}


	return {
		init: init,
		executeAction: executeAction
	};

})(jQuery);


/* uridgenerator.js */

/*

 Generator for Unique ID's, which are usefull for URID's (Unique Render Identifiers),
 used in Mustache files.

	Based on http://dbj.org/dbj/?p=76

*/

var UIDGenerator = (function () {

	"use strict";

	function get() {
		var uid = setTimeout(function() { clearTimeout(uid); }, 0);
		return uid;
	}

	return { get: get };

})();


/* validator.js */

/* global jQuery:false */

var Validator = (function ($) {
	"use strict";

	var errors = {};

	function validateForm(form) {
		//select all visible inputs which need validation
		errors = {};
		try {
			$("[data-validation]:visible").each(function () {
				validateInput(this);
			});
		}
		catch (err) {
			return false;
		}
		return (errors.length === 0);
	}

	function validateInput(elem) {
		var validations = $(elem).attr("data-validation").split(" ");
		var result = true;
		$.each(validations, function (index, validation) {
			var params = {};
			$(elem).parent().removeClass("has-error");
			if (!validateByString(validation, elem, params)) {
				errors[elem.name] = (typeof errors[elem.name] !== "undefined") ? errors[elem.name] : [];
				errors[elem.name].push(validation);
				$(elem).parent().addClass("has-error");
				result = false;
			}
		});
		return result;
	}

	function validateByString(validation, elem, params) {
		switch (validation) {
			case "required":
				return isRequired(elem, params);
			case "numeric":
				return isNumeric(elem, params);
			case "email":
				return isEmail(elem, params);
			case "url":
				return isEmail(elem, params);
			default:
				return true;
		}
	}

	function isRequired(elem, params) {
		return ((elem.nodeName === "INPUT") && (elem.type === "checkbox")) ? elem.checked : (elem.value !== "");
	}

	function isNumeric(elem, params) {
		var s = elem.value;
		if (params.decimalChar !== ".") {
			s = s.replace(params.decimalChar, ".");
		}
		return !isNaN(s);
	}

	function isEmail(elem, params) {
		var filter = /^([a-zA-Z0-9_\.\-])+@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
		return filter.test(elem.value);
	}

	function isUrl(elem, params) {
		var filter = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
		return filter.test(elem.value);
	}

	return {
		validateForm: validateForm,
		isRequired: isRequired,
		isNumberic: isNumeric,
		isEmail: isEmail,
		isUrl: isUrl
	};

})(jQuery);

