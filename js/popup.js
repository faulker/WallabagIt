/**
 * WallabagIt, a chrome extension for Wallabag.
 *
 * @author     Winter Faulk <winter@faulk.me>
 */

var storage =
{
    url: "",
    api_key: "",
    api_dir: "",
    url_opt: ""
}

function apiFeedURL()
{
    if( storage.api_dir == "" )
    {
        storage.api_dir = "api";
    }
    return storage.url + '/' + storage.api_dir + '/';
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

    chrome.storage.local.get('urlOption', function(result)
    {
        storage.url_opt = result.urlOption;
    });
    return storage_loaded.promise();
}


$( '#loading-img' ).hide(); // Hide the loading icon.

// Stop the getJSON calls from caching the results.
$.ajaxSetup({ cache: false });

// Get a feed [Unread, Favorites, Archived]
function getFeed( opt )
{
    var feed = {};
    switch( opt )
    {
        case "unread":
            chrome.storage.local.get('feedUnread', function( results )
            {
                loadFeed( results.feedUnread );
            });
            break;
        case "fav":
            chrome.storage.local.get('feedFav', function( results )
            {
                loadFeed( results.feedFav );
            });
            break;
        case "archive":
            chrome.storage.local.get('feedArchive', function( results )
            {
                loadFeed( results.feedArchive );
            });
            break;
        default:
            chrome.storage.local.get('feedUnread', function( results )
            {
                loadFeed( results.feedUnread );
            });
            break;
    }
    return false;
}

function updateFeed( feed )
{
    if( storage.api_key == "" || typeof( storage.api_key ) == "undefined" )
    {
         openOptions();
    }
    else
    {
        $( '#loading-img' ).show();
        chrome.runtime.sendMessage( feed, function( r )
        {
            $( '#loading-img' ).hide();
        });
    }
}

function loadFeed( data )
{
    $( '#loading-img' ).show();
    var link_url = storage.url + "/?view=view&id=";
    clear();
    for( var i in data )
    {
        var id = data[i].id;
        var title = data[i].title;
        var fav = data[i].is_fav;
        var archived = data[i].is_read;
        var link = link_url + id;
        switch( storage.url_opt )
        {
            case "wallabag":
                link = link_url + id;
                break;
            case "page":
                link = data[i].url;
                break;
        }

        loadItem( title, link, id, fav, archived );
        $( '#loading-img' ).hide();
    }
}

// Determine what tab is selected (unread, fav, archive)
function selectedTab()
{
    switch( $('.active').text() )
    {
        case "Unread":
            return "unread";
            break;
        case "Favorites":
            return "fav";
            break;
        case "Archive":
            return "archive";
            break;
        default:
            return "unread";
            break;
    }
}

// Load the items into the viewing window.
function loadItem( title, link, id, fav, archived )
{
    var short_title = title;
    if( title.length > 42 )
    {
        short_title = title.substr(0, 39) + "...";
    }

    if( fav == 1 )
    {
        fav = "flagged";
    }
    else
    {
        fav = "unflagged";
    }

    if( archived == 1 )
    {
        archived = "flagged";
    }
    else
    {
        archived = "unflagged";
    }

    var html_item = "<tr id='" + id + "'>"
                + "<td><a href='" + link + "' title='" + title + "'>" + short_title + "</a></td>"
                + "<td>"
                + "<span class='glyphicon glyphicon-ok " + archived + "' data-id='" + id + "' title='Archive it'></span>"
                + "<span class='glyphicon glyphicon-star " + fav + "' data-id='" + id + "' title='Add to favorites'></span>"
                + "<span class='glyphicon glyphicon-remove unflagged' data-id='" + id + "' title='Remove it'></span>"
                + "</td>"
                + "</tr>";
    $("#wallabags > table > tbody").append( html_item );
}

// Change an item, archive it or favorite it.
function changeItem( feedURL, opt, id )
{
    if( opt == "archive" )
    {
        $( '#' + id ).remove();
    }

    var req = $.getJSON( feedURL, { r: 'change', o: opt, id: id, apikey: storage.api_key }, function( data )
    {
        updateFeed({ unread: true, archive: true, fav: true });
    });
}

// Remove an item.
function removeItem( feedURL, id )
{
    $( '#' + id ).remove();
    var req = $.getJSON( feedURL, { r: 'delete', id: id, apikey: storage.api_key }, function( data )
    {
        updateFeed({ unread: true, archive: true, fav: true });
    });
}

// Add a new item to Wallabag.
function addItem( feedURL, url, title )
{
    var adding_item = $.Deferred();
    var req = $.getJSON( feedURL, { r: 'add', url: url, title: title, apikey: storage.api_key }, function( data )
    {
        updateFeed({ unread: true, archive: true, fav: true });
        adding_item.resolve( true );
    });
    return adding_item.promise();
}

// Open the options window
function openOptions()
{
    var options_url = chrome.extension.getURL( "options.html" );
    chrome.tabs.create( { url: options_url } );
}

// Clear all items in the display area.
function clear()
{
    $("#wallabags > table > tbody").empty();
}


$(document).ready(function()
{
    $( '.open-options' ).tooltip();
    $( '.wallabag-link' ).tooltip();

    $( '#add-link' ).click(function()
    {
        chrome.tabs.query({ 'active': true, 'currentWindow': true }, function( tabs )
        {
            var tablink = tabs[0].url;
            var title = tabs[0].title;
            $( '#add-link' ).html("<span class='glyphicon glyphicon-file'></span> Adding...");
            addItem( apiFeedURL(), tablink, title ).done(function()
            {
                $( '#add-link' ).html( "<span class='glyphicon glyphicon-file'></span> Add Page" );
            });
        });
    });

    $( '#wallabags' ).on('click', '.glyphicon-ok', function()
    {
        var id = $( this ).attr( 'data-id' );
        changeItem( apiFeedURL(), "archive", id );
        return false;
    });

    $( '#wallabags' ).on('click', '.glyphicon-star', function()
    {
        var id = $( this ).attr( 'data-id' );
        changeItem( apiFeedURL(), "fav", id );
        $( this ).toggleClass( 'flagged' ).toggleClass( 'unflagged' );
        return false;
    });

    $( '#wallabags' ).on('click', '.glyphicon-remove', function()
    {
        var id = $( this ).attr( 'data-id' );
        removeItem( apiFeedURL(), id );
        return false;
    });

   $( '.open-options' ).on('click', function()
    {
        openOptions();
    });

    $('#wallabags').on('click', 'a', function()
    {
        chrome.tabs.create( { url: $(this).attr('href') } );
        return false;
    });

    $( '.link' ).on('click', function()
    {
        chrome.tabs.create( { url: $( this ).attr( 'href' ) } );
        return false;
    });

    // Change what feed is loaded (Unread, Favorite, Archive)
    $( '.nav' ).on('click', 'li', function( e )
    {
        $('.nav li').each(function()
        {
            $( this ).removeClass( 'active' );
        });

        $( this ).attr( 'class', 'active' );
        var feed = $( this ).attr( 'data-link' );
        switch( feed )
        {
            case "unread":
                $( "#selected-tab" ).text("Unread");
                $( "#selected-glyph" ).removeClass("glyphicon-star glyphicon-ok-circle").addClass("glyphicon-inbox");
                getFeed( "unread" );
                break;
            case "fav":
                $( "#selected-tab" ).text("Favorites");
                $( "#selected-glyph" ).removeClass("glyphicon-inbox glyphicon-ok-circle").addClass("glyphicon-star");
                getFeed( "fav" );
                break;
            case "archive":
                $( "#selected-tab" ).text("Archive");
                $( "#selected-glyph" ).removeClass("glyphicon-star glyphicon-inbox").addClass("glyphicon-ok-circle");
                getFeed( "archive" );
                break;
        }
        $( '#wallabag-nav' ).collapse( 'hide' );
        return false;
    });
});

chrome.runtime.onInstalled.addListener( openOptions );
chrome.runtime.onStartup.addListener( loadStorage );

document.addEventListener('DOMContentLoaded', function ()
{
    loadStorage().done(function()
    {
        updateFeed({ unread: true, archive: true, fav: true });
        getFeed( "unread" );
    });
});

chrome.storage.onChanged.addListener( function( changes )
{
    for( key in changes )
    {
        if( key == "feedUnread" && selectedTab() == "unread" )
        {
            loadFeed( changes['feedUnread'].newValue );
        }

        if( key == "feedArchive" && selectedTab() == "archive" )
        {
            loadFeed( changes['feedArchive'].newValue );
        }

        if( key == "feedFav" && selectedTab() == "fav" )
        {
            loadFeed( changes['feedFav'].newValue );
        }
    }
});

