/* global jQuery */

var APIView = (function ($) {
	"use strict";

	function gotoHash(hash) {

		if ((hash === undefined) || (hash === "")) {
			return;
		}
		var items = hash.split("_");

		var module = items[1];

		$("a[href='#tab_" + module + "']").tab("show");
		if (items.length > 2) {
			$("a[href='" + hash + "']").tab("show");
		}
	}

	return {
		gotoHash: gotoHash
	};

})(jQuery);