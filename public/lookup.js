function numfrmt(num) {
	// Format number for printing
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

$(document).ready(function () {
    var user = window.location.pathname.split('/');
    user = user[user.length - 1];
    var dt = $('#dt').DataTable({
        order: [[0, 'asc']],
        columns: [
            { title: 'Channel', data: 'name' },
            { title: 'Followers', data: 'followers' },
            { title: 'Views', data: 'views' },
            { title: 'Partner', data: 'partnered' }
        ],
        deferRender: true,
        pageLength: 25,
        language: {
            search: '',
            searchPlaceholder: 'search'
        }
    });
    function getMods(offset) {
        $.getJSON('../api/user/' + user + '?limit=500&offset=' + offset, function (json) {
            offset += 500;
            dt.rows.add(json.channels.map(function (val) {
                val.partnered = val.partnered ? '\u2705' : '';
                val.name = '<a href="' + val.name + '">' + val.name + '</a>';
				val.views = '<span class="hidden">' + ('000000000000' + val.views).slice(-12) + '</span>' + numfrmt(val.views);
				val.followers = '<span class="hidden">' + ('000000000000' + val.followers).slice(-12) + '</span>' + numfrmt(val.followers);
				return val;
            }));
            if (json.count > offset) {
                $('#status').text('Loading... ' + offset + '/' + json.count);
                getMods(offset);
            } else {
                $('#status').text('');
                dt.draw();
            }
        });
    }
    $('#status').text('Loading...');
    getMods(0);
});
