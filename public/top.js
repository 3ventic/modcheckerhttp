$(document).ready(function () {
    var tops = ['modcount', 'views', 'followers'];

    $.getJSON('api/top', function (json) {
        for (var i = 0; i < tops.length; i += 1) {
            var data = json.top[tops[i]].map(function (val) {
                val.name = '<a href="u/' + val.name + '">' + val.name + '</a>';
                return val;
            });
            $('#dt_' + tops[i]).DataTable({
                order: [[i + 1, 'desc']],
                columns: [
                    { title: 'Moderator', data: 'name' },
                    { title: 'Swords', data: 'modcount' },
                    { title: 'Total Views', data: 'views' },
                    { title: 'Total Followers', data: 'followers' }
                ],
                deferRender: true,
                pageLength: 10,
                language: {
                    search: '',
                    searchPlaceholder: 'search'
                },
                data: json.top[tops[i]]
            });
        }
    });
});
