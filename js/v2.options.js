$(function ()
{
    // Called by options.js
    wIt.v2.save = function ()
    {
        wIt.settings.v2.id     = $('#api-client-id').val();
        wIt.settings.v2.secret = $('#api-client-secret').val();

        // todo: find out if these can be passed as hashes or if they need to be sent in the clear
        wIt.settings.v2.username = $('#wallabag-username').val();
        wIt.settings.v2.password = $('#wallabag-password').val();
    };

    wIt.v2.load = function ()
    {
        $('#api-client-id').val(wIt.settings.v2.id);
        $('#api-client-secret').val(wIt.settings.v2.secret);
        $('#wallabag-username').val(wIt.settings.v2.username);
        $('#wallabag-password').val(wIt.settings.v2.password);
    };

    document.addEventListener('DOMContentLoaded', function ()
    {

    });
});