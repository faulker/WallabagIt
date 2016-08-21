$(function ()
{
    var wItAuth = window.wItAuth = window.wItAuth || {};

    wItAuth.settings = {
        v1: {},
        v2: {},
        url: '',
        linking: 'wallabag',
        version: 2
    };

    wItAuth.token = null;

    $.ajaxSetup({cache: false});

    wItAuth.loadSettings = function ()
    {
        var loaded = $.Deferred();
        chrome.storage.local.get('wallabagItSettings', function (result)
        {
            wItAuth.settings = result.wallabagItSettings;
            loaded.resolve(true);
        });
        return loaded.promise();
    };

    wItAuth.getToken = function (url)
    {
        var loaded = $.Deferred();
        wItAuth.loadSettings().done(function ()
        {
            var url = url == undefined ? wItAuth.settings.url : url;
            var oauthURL = url + '/oauth/v2/token',
                data     = {
                    grant_type: 'password',
                    client_id: wItAuth.settings.v2.id,
                    client_secret: wItAuth.settings.v2.secret,
                    username: wItAuth.settings.v2.username,
                    password: wItAuth.settings.v2.password
                };

            $.post(oauthURL, data, function (token)
            {
                wItAuth.token = token;
                loaded.resolve(true);
            }).fail(function()
            {
                loaded.resolve(false);
            });
        });
        return loaded.promise();
    }
});
