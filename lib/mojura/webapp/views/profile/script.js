/* global jQuery:false */
/* global CryptoJS:false */
/* global Validator:false */

var ProfileView = (function ($) {

	"use strict";

	function resetForms() {
		$("form", "#modal-edit-profile")[0].reset();
		$(".has-error", "#modal-edit-profile").removeClass("has-error");
		$("form", "#modal-edit-password")[0].reset();
		$(".has-error", "#modal-edit-password").removeClass("has-error");
	}

	function editProfile() {
		if (!Validator.validateForm($("form", "#modal-edit-profile").get())) {
			return false;
		}

		$(".btn-primary", "#modal-edit-profile").button("loading");
		var values = {};
		$.each($("form", "#modal-edit-profile").serializeArray(), function (index, data) {
			values[data.name] = data.value;
		});

		var options = {
			success: function () {
				$("span[data-key=fullname]").html(values.firstname + " " + values.infix + " " + values.lastname);
				$("div[data-key=email]").attr("data-value", values.email).html("<a href='mailto:" + values.email + "'>" + values.email + "</a>");
				$("#modal-edit-profile").modal("hidden");
				$(".btn-primary", "#modal-edit-profile").button("reset");
			}
		};
		$("form", "#modal-edit-profile").ajaxSubmit(options);
	}

	function editPassword() {
		var username = $("div[data-key=username]").attr("data-value");
		var realm = $("input[name=realm]").val();
		var old_password = $("input[name=password_old]").val();
		var new_password = $("input[name=password_new]").val();
		var password_check = $("input[name=password_check]").val();
		var old_digest = CryptoJS.MD5(username + ":" + realm + ":" + old_password).toString();
		var new_digest = CryptoJS.MD5(username + ":" + realm + ":" + new_password).toString();

		var url = $("#modal-edit-password").find("form").attr("action");
		var data = "new_password=" + new_digest;
		if (old_password !== undefined) {
			data += "&old_password=" + old_digest;
		}
		$.post(url, data, function (json) {
			$("#modal-edit-password").modal("hidden");
			$(".btn-primary", "#modal-edit-password").button("reset");
		});
	}

	return {
		resetForms: resetForms,
		editProfile: editProfile,
		editPassword: editPassword
	};

})(jQuery);