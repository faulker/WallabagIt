/**
 * WallabagIt, a chrome extension for Wallabag.
 *
 * @author     Winter Faulk <winter@faulk.me>
 */

var storage =
{
    url: "",
    api_key: "",
    api_dir: ""
}

function loadStorage()
{
    var storage_loaded = $.Deferred();
    chrome.storage.local.get('url', function(result)
    {
        storage.url = result.url;
    });

    chrome.storage.local.get('apiKey', function(result)
    {
        storage.api_key = result.apiKey;
        storage_loaded.resolve( true );
    });

    chrome.storage.local.get('apiDir', function(result)
    {
        storage.api_dir = result.apiDir;
    });

    if( storage.api_dir == "" )
    {
        storage.api_dir = "api";
    }
    return storage_loaded.promise();
}

// Stop the getJSON calls from caching the results.
$.ajaxSetup({ cache: false });

chrome.runtime.onMessage.addListener( function( msg, sender, sendResponse )
{
    loadStorage().done(function()
    {
        var apiFeedURL = storage.url + '/' + storage.api_dir + '/';
        if( msg.fav )
        {
            var req = $.getJSON( apiFeedURL, { r: 'get', o: 'fav', apikey: storage.api_key }, function( data )
            {
                chrome.storage.local.set( { 'feedFav': data } );
            });
        }
        
        if( msg.archive )
        {
            var req = $.getJSON( apiFeedURL, { r: 'get', o: 'archive', apikey: storage.api_key }, function( data )
            {
                chrome.storage.local.set( { 'feedArchive': data } );
            });
        }
        
        if( msg.unread )
        {
            var req = $.getJSON( apiFeedURL, { r: 'get', o: 'all', apikey: storage.api_key }, function( data )
            {
                chrome.storage.local.set( { 'feedUnread': data } );
            });
        }

        sendResponse({done: true});
    });
});
