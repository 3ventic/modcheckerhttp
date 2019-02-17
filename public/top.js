function numfrmt(num) {
	// Format number for printing
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

$(document).ready(function() {
	var tops = ["modcount", "partners", "views", "followers"];

	$.getJSON("api/top", function(json) {
		for (var i = 0; i < tops.length; i += 1) {
			json.top[tops[i]].map(function(val) {
				val.name = '<a href="u/' + val.name + '">' + val.name + "</a>";
				val.modcount =
					'<span class="hidden">' +
					("000000000000" + val.modcount).slice(-12) +
					"</span>" +
					numfrmt(val.modcount);
				val.partners =
					'<span class="hidden">' +
					("000000000000" + val.partners).slice(-12) +
					"</span>" +
					numfrmt(val.partners);
				val.followers =
					'<span class="hidden">' +
					("00000000000000" + val.followers).slice(-14) +
					"</span>" +
					numfrmt(val.followers);
				val.views =
					'<span class="hidden">' +
					("00000000000000" + val.views).slice(-14) +
					"</span>" +
					numfrmt(val.views);
				return val;
			});
			$("#dt_" + tops[i]).DataTable({
				order: [[i + 1, "desc"]],
				columns: [
					{ title: "Moderator", data: "name" },
					{ title: "Swords", data: "modcount" },
					{ title: "Partner Channel Swords", data: "partners" },
					{ title: "Total Views", data: "views" },
					{ title: "Total Followers", data: "followers" }
				],
				deferRender: true,
				pageLength: 10,
				language: {
					search: "",
					searchPlaceholder: "search"
				},
				data: json.top[tops[i]]
			});
		}
	});
});
