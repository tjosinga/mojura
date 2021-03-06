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
			oncreated: function(modalId, onLoaded) {
				$("#" + modalId).modal("show");
				$.getJSON("__api__/users/" + _userId, function(json) {
					oldJson = json;
					var template = $("#template-edit-userinfo").html();
					var html = Mustache.render(template, json);
					$(".modal-body", "#" + modalId).html(html);
					onLoaded();
				});
				return true;
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
			save_form: false,
			oncreated: function(modalId, onLoaded) {
				$("#" + modalId).modal("show");
				$.getJSON("__api__/users/" + _userId + "?include_settings=core.realm", function(json) {
					var template = $("#template-edit-avatar").html();
					if (json.avatar.indexOf("gravatar.com") > 0) {
						json.gravatar = json.avatar + "&s=256";
						json.avatar = json.gravatar + "&f=y";
						json.uses_gravatar = true;
					} else {
						json.gravatar = "http://www.gravatar.com/avatar/" + CryptoJS.MD5(json.email) + "?d=mm&s=256";
						json.uses_gravatar = false;
					}
					var html = Mustache.render(template, json);
					$(".modal-body", "#" + modalId).html(html);
					onLoaded();
				});
				return true;
			}
		});
	}

	function uploadAvatar($form) {
		$form.ajaxForm({
			success: function (json) {
				var src = json[0];
				$(".avatar", ".avatar-form").parent().addClass("selected").find("img").attr("src", src);
				$(".gravatar", ".avatar-form").parent().removeClass("selected");
				$(".btn-delete", ".avatar-form").removeClass("hidden");
				$(".view-data .user-info .avatar img").attr("src", src);
				$("form", ".avatar-form").reset();
			},
			error: function() {
				//TODO: Proper error handling
				window.alert("failed");
			}
		}).submit();
	}

	function deleteAvatar() {
		var url = "__api__/users/" + _userId + "/avatar?_method=delete";
		$.getJSON(url, function(json) {
			var src = json[0] + "&s=256";
			$(".avatar", ".avatar-form").parent().removeClass("selected").find("img").attr("src", src + "&f=y");
			$(".gravatar", ".avatar-form").parent().addClass("selected");
			$(".btn-delete", ".avatar-form").addClass("hidden");
			$(".view-data .user-info .avatar img").attr("src", src);
		}).error(function() {
			//TODO: Proper error handling
			window.alert("failed");
		});
	}

	function showEditPassword() {
		Modal.create({
			title: Locale.str("users", "edit_password"),
			save_form: false,
			oncreated: function(modalId, onLoaded) {
				$("#" + modalId).modal("show");
				$.getJSON("__api__/users/" + _userId + "?include_settings=core.realm", function(json) {
					var template = $("#template-edit-password").html();
					json.force_password = (json.force_password === true);
					var html = Mustache.render(template, json);
					$(".modal-body", "#" + modalId).html(html);
					onLoaded();
				});
				return true;
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
				data += "&_method=put";
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
			},
			onsubmitted: function(data) {
			}
		});
	}




	return {
		initialize: initialize,
		showEditUserInfo: showEditUserInfo,
		showEditAvatar: showEditAvatar,
		uploadAvatar: uploadAvatar,
		deleteAvatar: deleteAvatar,
		showEditPassword: showEditPassword,
		showEditGroups: showEditGroups,
		showDeactivateUser: showDeactivateUser,

	}

})(jQuery);