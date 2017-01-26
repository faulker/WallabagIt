$(function ()
{
    // Called by options.js
    wItOpt.v2.save = function ()
    {
        wItOpt.settings.v2.id     = $('#api-client-id').val();
        wItOpt.settings.v2.secret = $('#api-client-secret').val();

        // todo: find out if these can be passed as hashes or if they need to be sent in the clear
        wItOpt.settings.v2.username = $('#wallabag-username').val();
        wItOpt.settings.v2.password = $('#wallabag-password').val();
    };

    wItOpt.v2.load = function ()
    {
        $('#api-client-id').val(wItOpt.settings.v2.id);
        $('#api-client-secret').val(wItOpt.settings.v2.secret);
        $('#wallabag-username').val(wItOpt.settings.v2.username);
        $('#wallabag-password').val(wItOpt.settings.v2.password);
    };

    wItOpt.v2.checkUrl = function(url)
    {
        var checking_api = $.Deferred();
        wItAuth.getToken(url).done(function(status)
        {
            checking_api.resolve(status);
        });
        return checking_api.promise();
    }
});
