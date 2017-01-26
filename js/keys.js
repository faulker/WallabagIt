$(function()
{
    var settings = {};

    loadSettings = function ()
    {
        var loaded = $.Deferred();

        chrome.storage.local.get('wallabagItSettings', function (result)
        {
            if(result.wallabagItSettings != undefined && 'v1' in result.wallabagItSettings && 'v2' in result.wallabagItSettings)
            {
                settings = result.wallabagItSettings;
            }
            loaded.resolve(true);
        });

        return loaded.promise();
    };

    var v1url = function ()
    {
        if (settings.v1.folder == "")
        {
            settings.v1.folder = "api";
        }
        return settings.url + '/' + settings.v1.folder + '/';
    };

    var savePage = function(url, title)
    {
        loadSettings().done(function ()
        {
            var addItem = $.Deferred();

            switch (settings.version.toString())
            {
                case '1':
                    var feedURL = v1url();
                    $.getJSON(feedURL, {
                        r: 'add',
                        url: url,
                        title: title,
                        apikey: settings.v1.key
                    }, function (data)
                    {
                        wItApi.v1.get({fav: true});
                    });
                    break;
                default:
                    wItAuth.getToken().done(function ()
                    {
                        var feedURL = settings.url + '/api/entries.json';
                        $.post(feedURL, {
                            'url': url,
                            'title': title,
                            'access_token': wItAuth.token.access_token
                        }, function ()
                        {
                            wItApi.v2.get();
                        });
                    });
            }

            return addItem.promise();
        });
    };

    chrome.commands.onCommand.addListener(function(command) {
        switch(command)
        {
            case 'wallabag-page':
                chrome.tabs.query({
                    'active': true,
                    'currentWindow': true
                }, function (tabs)
                {
                    var tablink = tabs[0].url;
                    var title   = tabs[0].title;
                    savePage(tablink, title);
                });
                break;
        }
    });
});
