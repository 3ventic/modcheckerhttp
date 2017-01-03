$(document).ready(function () {
    var tops = ['modcount', 'views', 'followers'];

    $.getJSON('api/top', function (json) {
        for (var i = 0; i < tops.length; i += 1) {
            $('#dt_' + tops[i]).DataTable({
                order: [[i + 1, 'desc']],
                columns: [
                    { title: 'Moderator', data: 'name' },
                    { title: 'Swords', data: 'modcount' },
                    { title: 'Total Followers', data: 'followers' },
                    { title: 'Total Views', data: 'views' },
                ],
                deferRender: true,
                pageLength: 10,
                language: {
                    search: '',
                    searchPlaceholder: ''
                },
                data: json.top[tops[i]]
            });
        }
    });
});
