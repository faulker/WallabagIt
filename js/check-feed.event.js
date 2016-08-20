/**
 * WallabagIt, a chrome extension for Wallabag.
 *
 * @author     Winter Faulk <winter@faulk.me>
 */

var storage = {
    v1: {},
    v2: {},
    url: '',
    linking: 'wallabag',
    version: 2
};

function loadStorage()
{
    var storage_loaded = $.Deferred();
    chrome.storage.local.get('settings', function (result)
    {
        storage = result.settings;
        storage_loaded.resolve(true);
    });
    return storage_loaded.promise();
}

// Stop the getJSON calls from caching the results.
$.ajaxSetup({cache: false});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse)
{
    loadStorage().done(function ()
    {
        var apiFeedURL = storage.url + '/' + storage.v1.folder + '/';
        if (msg.fav)
        {
            var req = $.getJSON(apiFeedURL, {
                r: 'get',
                o: 'fav',
                apikey: storage.v1.key
            }, function (data)
            {
                chrome.storage.local.set({'feedFav': data});
            });
        }

        if (msg.archive)
        {
            var req = $.getJSON(apiFeedURL, {
                r: 'get',
                o: 'archive',
                apikey: storage.v1.key
            }, function (data)
            {
                chrome.storage.local.set({'feedArchive': data});
            });
        }

        if (msg.unread)
        {
            var req = $.getJSON(apiFeedURL, {
                r: 'get',
                o: 'all',
                apikey: storage.v1.key
            }, function (data)
            {
                chrome.storage.local.set({'feedUnread': data});
            });
        }

        sendResponse({done: true});
    });
});
