var UsersView = (function($) {

	'use strict';

	var _userId = "";

	function initialize(userId) {
		_userId = userId;
	}

	function showEditUserInfo() {
		var oldJson = {};
		Modal.create({
			title: Locale.str("users", "edit_userinfo"),
			oncreated: function(modalId) {
				$("#" + modalId).modal("show");
				$.getJSON("__api__/users/" + _userId, function(json) {
					oldJson = json;
					var template = $("#template-edit-userinfo").html();
					var html = Mustache.render(template, json);
					$(".modal-body", "#" + modalId).html(html);
				});
			},
			onsubmitted: function(modalId, json) {
				if (oldJson.fullname !== json.fullname) {
					$(".fullname", "#user-info-" + _userId).text(json.fullname);
				}
				if (oldJson.email !== json.email) {
					$(".email a", "#user-info-" + _userId).text(json.email).attr("href", "mailto:" + json.email);
				}
				if (oldJson.avatar !== json.avatar) {
					var src = $(".avatar img", "#user-info-" + _userId).attr("src");
					src = src.replace(oldJson.avatar, json.avatar);
					$(".avatar img", "#user-info-" + _userId).attr("src", src);
				}
			}
		});
	}

	function showEditAvatar() {
		Modal.create({
			title: Locale.str("users", "edit_avatar"),
			btn_action: Locale.str("system", "close"),
			btn_cancel: false,
			oncreated: function(modalId) {
				$("#" + modalId).modal("show");
				$.getJSON("__api__/users/" + _userId + "?include_settings=core.realm", function(json) {
					var template = $("#template-edit-avatar").html();
					json.gravatar = json.avatar;
					if (json.avatar.indexOf("gravatar.com") > 0) {
						json.gravatar = "http://www.gravatar.com/avatar/" + CryptoJS.MD5(json.email) + "?d=mm";
						json.avatar += "&f=y";
						json.use_gravatar = true;
					}
					var html = Mustache.render(template, json);
					$(".modal-body", "#" + modalId).html(html);
				});
			},
		});
	}

	function showEditPassword() {
		Modal.create({
			title: Locale.str("users", "edit_password"),
			oncreated: function(modalId) {
				$("#" + modalId).modal("show");
				$.getJSON("__api__/users/" + _userId + "?include_settings=core.realm", function(json) {
					var template = $("#template-edit-password").html();
					json.force_password = (json.force_password === true);
					var html = Mustache.render(template, json);
					$(".modal-body", "#" + modalId).html(html);
				});
			},
			onaction: function(modalId) {
				var $form = $("form", "#" + modalId);
				$("input[type=password]").removeClass("has-error");
				var username = $form.attr("data-username");
				var realm = $form.attr("data-realm");
				var old_password = $("input[name=password_old]", $form).val();
				var new_password = $("input[name=password_new]", $form).val();
				var password_check = $("input[name=password_check]", $form).val();

				if (new_password !== password_check) {
					$("input[name=password_new], input[name=password_check]").closest(".form-group").addClass("has-error");
					return;
				}

				var data = "new_password=" + CryptoJS.MD5(username + ":" + realm + ":" + new_password).toString();
				if (old_password !== undefined) {
					data += "&old_password=" + CryptoJS.MD5(username + ":" + realm + ":" + old_password).toString();
				}
				$.post($form.attr("action"), data, function () {
					$(".btn-primary", "#" + modalId).button("complete").addClass("btn-success disabled");
					$("#" + modalId).modal("hide");
				}).fail(function() {
					window.alert("an error occured");
				});
			}
		});
	}

	function showEditGroups() {
		Modal.create({
			title: Locale.str("users", "edit_groups"),
			oncreated: function(modalId) {
				var template = $("#template-edit-groups").html();
				var data = {};
				var html = Mustache.render(template, data);
				$(".modal-body", "#" + modalId).html(html);
				$("#" + modalId).modal("show");
			},
			onsubmitted: function(data) {

			}
		});
	}

	function showDeactivateUser() {
		Modal.create({
			title: Locale.str("users", "deactivate_user"),
			oncreated: function(modalId) {
				var template = $("#template-deactivate-user").html();
				var data = {};
				var html = Mustache.render(template, data);
				$(".modal-body", "#" + modalId).html(html);
				$("#" + modalId).modal("show");
			},
			onsubmitted: function(data) {

			}
		});
	}




	return {
		initialize: initialize,
		showEditUserInfo: showEditUserInfo,
		showEditAvatar: showEditAvatar,
		showEditPassword: showEditPassword,
		showEditGroups: showEditGroups,
		showDeactivateUser: showDeactivateUser,

	}

})(jQuery);