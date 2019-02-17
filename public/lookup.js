function numfrmt(num) {
	// Format number for printing
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

$(document).ready(function() {
	var user = window.location.pathname.split("/");
	user = user[user.length - 1];
	var dt = $("#dt").DataTable({
		order: [[0, "asc"]],
		columns: [
			{ title: "Channel", data: "name" },
			{ title: "Followers", data: "followers" },
			{ title: "Views", data: "views" },
			{ title: "Partner", data: "partnered" }
		],
		deferRender: true,
		pageLength: 25,
		language: {
			search: "",
			searchPlaceholder: "search"
		}
	});
	var total = "...";
	function getMods(cursor, loaded) {
		var limit = 2000;
		$.getJSON("../api/user-v3/" + user + "?limit=" + limit + "&cursor=" + cursor, function(json) {
			dt.rows.add(
				json.channels.map(function(val) {
					val.partnered = val.partnered ? "\u2705" : "";
					val.name = '<a href="' + val.name + '">' + val.name + "</a>";
					val.views =
						'<span class="hidden">' +
						("000000000000" + val.views).slice(-12) +
						"</span>" +
						numfrmt(val.views);
					val.followers =
						'<span class="hidden">' +
						("000000000000" + val.followers).slice(-12) +
						"</span>" +
						numfrmt(val.followers);
					return val;
				})
			);
			loaded += json.channels.length;
			if (json.cursor !== "") {
				$("#status").text("Loading... " + loaded + "/" + total);
				getMods(json.cursor, loaded);
			} else {
				$("#status").text("");
				dt.draw();
			}
		});
	}
	$("#status").text("Loading...");
	getMods("", 0);

	$.getJSON("../api/user-totals/" + user, function(json) {
		$("#totalviews").text(numfrmt(json.views));
		$("#totalfollows").text(numfrmt(json.follows));
		$("#totalpartners").text(numfrmt(json.partners));
		total = json.total;
	});
});
