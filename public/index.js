$(document).ready(function () {
    function lookup() {
        window.location.href += 'u/' + $('#user').val();
    }

    $('#user').focus();
    $('#user').on('keydown', function (e) {
        if (13 == (e.which || e.keyCode)) {
            lookup();
            return false;
        }
        return true;
    });
    $('#lookup').click(lookup);
});
