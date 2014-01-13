var PollsView = (function($, Mustache) {
	"use strict";

	var pollData = {};

	function loadPoll(pollid) {

	}

	function vote(pollid, index) {
		var url = "__api__/polls/" + pollid + "/votes?_method=put&index=" + index;
		$(".poll-" + pollid + " .data-container").html("<div class='loading'></div>");
		$.getJSON(url, function(data) {
			pollData[pollid] = data;
			showResults(pollid);
		});
	}

	function showResults(pollid) {
		withPollData(pollid, function(data) {
			for (var i = 0; i < data.options.length; i++) {
				data.options[i].votes.rounded_percentage = Math.round(data.options[i].votes.percentage);
				data.options[i].votes.percentage = Math.round(data.options[i].votes.percentage * 10) / 10;
			}
			var template = $("#template-polls-results").html();
			var html = Mustache.render(template, data);
			$(".poll-" + pollid + " .data-container").html(html);
		});
	}

	function withPollData(pollid, onLoaded) {
		if (typeof pollData[pollid] !== "undefined") {
			onLoaded(pollData[pollid]);
		}
		else {
			$.getJSON("__api__/polls/" + pollid + "?include_votes=true", function(data) {
				pollData[pollid] = data;
				onLoaded(data);
			});
		}
	}

	function showAddVote(pollid) {

	}

	function showEditVote(pollid) {

	}

	function showDeleteVote(pollid) {

	}

	return {
		loadPoll: loadPoll,
		vote: vote,
		showResults: showResults,
		showAddVote: showAddVote,
		showEditVote: showEditVote,
		showDeleteVote: showDeleteVote
	};

})(jQuery, Mustache);