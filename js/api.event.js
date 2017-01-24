/**
 * WallabagIt, a chrome extension for Wallabag.
 *
 * @author     Winter Faulk <winter@faulk.me>
 */

$(function ()
{
    var wItApi = window.wItApi = window.wItApi || {};

    wItApi.v1 = {};
    wItApi.v2 = {};

    wItApi.settings = {
        v1: {},
        v2: {},
        url: '',
        linking: 'wallabag',
        version: 2
    };

    // Stop the getJSON calls from caching the results.
    $.ajaxSetup({cache: false});

    wItApi.loadSettings = function ()
    {
        var loaded = $.Deferred();
        chrome.storage.local.get('wallabagItSettings', function (result)
        {
            wItApi.settings = result.wallabagItSettings;
            loaded.resolve(true);
        });
        return loaded.promise();
    };

    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse)
    {
        var resp = sendResponse;

        wItApi.loadSettings().done(function ()
        {
            var result = false;
            switch (wItApi.settings.version.toString())
            {
                case '1':
                    result = wItApi.v1.get(msg);
                    break;
                default:
                    result = wItApi.v2.get(msg);
            }

            if(true === result) {
              resp({ done: true });
            } else {
              result.done(function ()
              {
                resp({ done: true });
              }).fail(function (xhr)
              {
                resp({ done: false, error: JSON.parse(xhr.responseText) });
              });
            }
        });

        return true; // required in order to send async `sendResponse`
    });

    wItApi.v2.get = function (msg)
    {
        var apiURL = wItApi.settings.url + '/api/entries.json';
        var loaded = $.Deferred();

        wItAuth.getToken().done(function()
        {
            $.get(apiURL, {access_token: wItAuth.token.access_token}, function (entries)
            {
                var archived = [],
                    starred  = [],
                    unread   = [],
                    items = entries._embedded.items;

                for (var i in items)
                {
                    var item = items[i];

                    if(item.is_starred)
                    {
                        starred.push(item);
                    }

                    if(item.is_archived)
                    {
                        archived.push(item);
                    }
                    else // unread
                    {
                        unread.push(item);
                    }
                }

                chrome.storage.local.set({'wallabagItArchive': archived});
                chrome.storage.local.set({'wallabagItFav': starred});
                chrome.storage.local.set({'wallabagItUnread': unread});
            }).done(function (xhr) {
              loaded.resolve(xhr);
            }).fail(function (xhr) {
              loaded.reject(xhr);
            });
        });

        return loaded.promise();
    };

    wItApi.v1.get = function (msg)
    {
        var apiFeedURL = wItApi.settings.url + '/' + wItApi.settings.v1.folder + '/';
        if (msg.fav)
        {
            var req = $.getJSON(apiFeedURL, {
                r: 'get',
                o: 'fav',
                apikey: wItApi.settings.v1.key
            }, function (data)
            {
                chrome.storage.local.set({'wallabagItFav': data});
            });
        }

        if (msg.archive)
        {
            var req = $.getJSON(apiFeedURL, {
                r: 'get',
                o: 'archive',
                apikey: wItApi.settings.v1.key
            }, function (data)
            {
                chrome.storage.local.set({'wallabagItArchive': data});
            });
        }

        if (msg.unread)
        {
            var req = $.getJSON(apiFeedURL, {
                r: 'get',
                o: 'all',
                apikey: wItApi.settings.v1.key
            }, function (data)
            {
                chrome.storage.local.set({'wallabagItUnread': data});
            });
        }

        return true;
    }

});
