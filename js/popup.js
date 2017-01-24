/**
 * WallabagIt, a chrome extension for Wallabag.
 *
 * @author     Winter Faulk <winter@faulk.me>
 */
$(function ()
{
    // -------------------
    // Init
    // --------------------------------
    var wItPop = window.wIt = window.wIt || {};

    wItPop.v1       = {};
    wItPop.v2       = {};
    wItPop.settings = {
        v1: {},
        v2: {},
        url: '',
        linking: 'wallabag',
        version: 2
    };
    wItPop.cache    = {
        unread: {},
        archive: {},
        fav: {}
    };
    wItPop.feed     = {};
    wItPop.tab      = {};
    wItPop.item     = {};

    var $wallabags = $('#wallabags'),
        $openOpt   = $('.open-options'),
        $tab       = $('#selected-tab'),
        $glyph     = $('#selected-glyph'),
        $error     = $('#error-img'),
        $loading   = $('#loading-img');

    $.ajaxSetup({cache: false}); // Stop the getJSON calls from caching the results.

    // -------------------
    // Functions
    // --------------------------------
    wItPop.v1.url = function ()
    {
        if (wItPop.settings.v1.folder == "")
        {
            wItPop.settings.v1.folder = "api";
        }
        return wItPop.settings.url + '/' + wItPop.settings.v1.folder + '/';
    };

    wItPop.loadSettings = function ()
    {
        var loaded = $.Deferred();

        chrome.storage.local.get('wallabagItSettings', function (result)
        {
            if(result.wallabagItSettings != undefined && 'v1' in result.wallabagItSettings && 'v2' in result.wallabagItSettings)
            {
                wItPop.settings = result.wallabagItSettings;
            }
            loaded.resolve(true);
        });

        return loaded.promise();
    };

    wItPop.feed.load = function (feed)
    {
        $loading.show();
        $error.hide();

        switch (feed)
        {
            case "fav":
                chrome.storage.local.get('wallabagItFav', function (results)
                {
                    wItPop.cache.fav = results.wallabagItFav;
                    wItPop.feed.build(results.wallabagItFav);
                    $loading.delay(200).hide(0);
                });
                break;
            case "archive":
                chrome.storage.local.get('wallabagItArchive', function (results)
                {
                    wItPop.cache.archive = results.wallabagItArchive;
                    wItPop.feed.build(results.wallabagItArchive);
                    $loading.delay(200).hide(0);
                });
                break;
            case "unread":
            default:
                chrome.storage.local.get('wallabagItUnread', function (results)
                {
                    wItPop.cache.unread = results.wallabagItUnread;
                    wItPop.feed.build(results.wallabagItUnread);
                    $loading.delay(200).hide(0);
                });
                break;
        }
    };

    wItPop.feed.update = function (feed)
    {
        $loading.show();
        $error.hide();

        switch (wItPop.settings.version.toString())
        {
            case '1':
                if ('key' in wItPop.settings.v1)
                {
                    chrome.runtime.sendMessage(feed, function (r)
                    {
                        $loading.delay(200).hide(0);
                    });
                }
                else
                {
                    wItPop.options();
                }
                break;
            default:
                if ('secret' in wItPop.settings.v2)
                {
                    chrome.runtime.sendMessage(feed, function (r)
                    {
                        $loading.delay(200).hide(0);
                    });
                }
                else
                {
                    wItPop.options();
                }
        }

    };

    wItPop.feed.build = function (data)
    {
        switch (wItPop.settings.version.toString())
        {
            case '1':
                wItPop.feed.build.v1(data);
                break;
            default:
                wItPop.feed.build.v2(data);
        }
    };

    wItPop.feed.build.v1 = function (data)
    {
        $loading.show();
        $error.hide();

        var url = wItPop.settings.url + "?view=view&id=";
        $("#wallabags-body").empty();

        for (var i in data)
        {
            var id       = data[i].id;
            var title    = data[i].title;
            var fav      = data[i].is_fav;
            var archived = data[i].is_read;
            var link     = url + id;
            switch (wItPop.settings.linking)
            {
                case "wallabag":
                    link = url + id;
                    break;
                case "page":
                    link = data[i].url;
                    break;
            }

            wItPop.feed.loadItems(title, link, id, fav, archived);
        }

        $loading.delay(200).hide(0);
    };

    wItPop.feed.build.v2 = function (data)
    {
        $loading.show();
        $error.hide();

        if (data != undefined)
        {
            $("#wallabags-body").empty();

            for (var i in data)
            {
                var id       = data[i].id,
                    title    = data[i].title,
                    fav      = data[i].is_starred,
                    archived = data[i].is_archived,
                    link     = null;

                switch (wItPop.settings.linking)
                {
                    case "page":
                        link = data[i].url;
                        break;
                    case "wallabag":
                    default:
                        link = wItPop.settings.url + '/view/' + id;
                        break;
                }

                wItPop.feed.loadItems(title, link, id, fav, archived);
            }

        }
        $loading.delay(200).hide(0);
    };

    // Load the items into the viewing window.
    wItPop.feed.loadItems = function (title, link, id, fav, archived)
    {
        var short_title   = title,
            favKlass      = "unflagged",
            archivedKlass = "unflagged";

        if (title.length > 42)
        {
            short_title = title.substr(0, 39) + "...";
        }

        if (fav == 1)
        {
            favKlass = "flagged";
        }

        if (archived == 1)
        {
            archivedKlass = "flagged";
        }

        var html_item = "<tr id='" + id + "' class='bags'>"
            + "<td class='links'><a href='" + link + "' title='" + title + "'>" + short_title + "</a></td>"
            + "<td class='actions'>"
            + "<span class='glyphicon glyphicon-ok " + archivedKlass + "' data-id='" + id + "' data-status='" + archived + "' title='Archive it'></span>"
            + "<span class='glyphicon glyphicon-star " + favKlass + "' data-id='" + id + "' data-status='" + fav + "' title='Add to favorites'></span>"
            + "<span class='glyphicon glyphicon-remove unflagged' data-id='" + id + "' title='Remove it'></span>"
            + "</td>"
            + "</tr>";

        $("#wallabags-body").append(html_item);
    };

    // Change an item, archive it or favorite it.
    wItPop.item.change = function (opt, id, status)
    {
        if (opt == "archive")
        {
            $('#' + id).remove();
        }

        switch (wItPop.settings.version.toString())
        {
            case '1':
                var feedURL = wItPop.v1.url();
                var req     = $.getJSON(feedURL, {
                    r: 'change',
                    o: opt,
                    id: id,
                    apikey: wItPop.settings.v1.key
                }, function (data)
                {
                    wItPop.feed.update({
                        unread: true,
                        archive: true,
                        fav: true
                    });
                });
                break;
            default:
                wItAuth.getToken().done(function ()
                {
                    var feedURL = wItPop.settings.url + '/api/entries/' + id + '.json',
                        data    = {
                            'access_token': wItAuth.token.access_token
                        };

                    switch (opt)
                    {
                        case 'archive':
                            data.archive = status;
                            break;
                        case 'fav':
                            data.starred = status;
                            break;
                    }

                    $.ajax({
                        url: feedURL,
                        method: 'PATCH',
                        data: data,
                        success: function ()
                        {
                            wItPop.feed.update({
                                unread: true,
                                archive: true,
                                fav: true
                            });
                        }
                    });
                });
        }

        return true;

    };

    // Remove an item.
    wItPop.item.remove = function (id)
    {
        $('#' + id).remove();
        switch (wItPop.settings.version.toString())
        {
            case '1':
                var feedURL = wItPop.v1.url();
                var req     = $.getJSON(feedURL, {
                    r: 'delete',
                    id: id,
                    apikey: wItPop.settings.v1.key
                }, function (data)
                {
                    wItPop.feed.update({
                        unread: true,
                        archive: true,
                        fav: true
                    });
                });
                break;
            default:
                wItAuth.getToken().done(function ()
                {
                    var feedURL = wItPop.settings.url + '/api/entries/' + id + '.json';
                    $.ajax({
                        url: feedURL,
                        method: 'DELETE',
                        data: {'access_token': wItAuth.token.access_token},
                        success: function ()
                        {
                            wItPop.feed.update({
                                unread: true,
                                archive: true,
                                fav: true
                            });
                        }
                    });
                });
        }
    };

    // Add a new item to Wallabag.
    wItPop.item.add = function (url, title)
    {
        var addItem = $.Deferred();

        switch (wItPop.settings.version.toString())
        {
            case '1':
                var feedURL = wItPop.v1.url();
                $.getJSON(feedURL, {
                    r: 'add',
                    url: url,
                    title: title,
                    apikey: wItPop.settings.v1.key
                }, function (data)
                {
                    wItPop.feed.update({
                        unread: true,
                        archive: true,
                        fav: true
                    });
                    addItem.resolve(true);
                });
                break;
            default:
                wItAuth.getToken().done(function ()
                {
                    var feedURL = wItPop.settings.url + '/api/entries.json';
                    $.post(feedURL, {
                        'url': url,
                        'title': title,
                        'access_token': wItAuth.token.access_token
                    }, function ()
                    {
                        wItPop.feed.update({
                            unread: true,
                            archive: true,
                            fav: true
                        });
                        addItem.resolve(true);
                    }).fail(function (xhr)
                    {
                        addItem.reject(JSON.parse(xhr.responseText));
                    });
                });
        }

        return addItem.promise();
    };

    // Determine what tab is selected (unread, fav, archive)
    wItPop.tab.selected = function ()
    {
        var tab = $('#head-tabs').find('.active').data('link');
        switch (tab)
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
                return tab;
                break;
        }
    };

    // Open the options window
    wItPop.options = function ()
    {
        var options_url = chrome.extension.getURL("options.html");
        chrome.tabs.create({url: options_url});
    };

    // -------------------
    // Actions
    // --------------------------------
    $('.wallabag-link').tooltip();
    $openOpt.tooltip();

    $('#add-link').click(function ()
    {
        chrome.tabs.query({
            'active': true,
            'currentWindow': true
        }, function (tabs)
        {
            var tablink = tabs[0].url;
            var title   = tabs[0].title;
            $('#add-link').html("<span class='glyphicon glyphicon-file'></span> Adding...");
            wItPop.item.add(tablink, title).done(function ()
            {
                $('#add-link').html("<span class='glyphicon glyphicon-file'></span> Add Page");
            }).fail(function (status) {
                $error.show().attr('title', "Sorry, something went wrong! " + status.error_description);
            });
        });
    });

    $wallabags.on('click', '.glyphicon-ok', function ()
    {
        var id        = $(this).data('id'),
            status    = $(this).data('status'),
            newStatus = (status == 0 || status == '0') ? 1 : 0;

        wItPop.item.change("archive", id, newStatus);
        $(this).data('status', newStatus);

        return false;
    }).on('click', '.glyphicon-star', function ()
    {
        var id        = $(this).data('id'),
            status    = $(this).data('status'),
            newStatus = (status == 0 || status == '0') ? 1 : 0;

        wItPop.item.change("fav", id, newStatus);
        $(this).data('status', newStatus);
        $(this).toggleClass('flagged').toggleClass('unflagged');

        return false;
    }).on('click', '.glyphicon-remove', function ()
    {
        var id = $(this).attr('data-id');
        wItPop.item.remove(id);
        return false;
    }).on('click', 'a', function ()
    {
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
    });

    $openOpt.on('click', function ()
    {
        wItPop.options();
    });

    $('.link').on('click', function ()
    {
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
    });

    // Change what feed is loaded (Unread, Favorite, Archive)
    $('.nav').on('click', 'li', function (e)
    {
        $('.nav li').each(function ()
        {
            $(this).removeClass('active');
        });

        $(this).addClass('active');
        var feed = $(this).data('link');

        switch (feed)
        {
            case "unread":
                $tab.text("Unread");
                $glyph.removeClass("glyphicon-star glyphicon-ok-circle").addClass("glyphicon-inbox");
                wItPop.feed.load("unread");
                break;
            case "fav":
                $tab.text("Favorites");
                $glyph.removeClass("glyphicon-inbox glyphicon-ok-circle").addClass("glyphicon-star");
                wItPop.feed.load("fav");
                break;
            case "archive":
                $tab.text("Archive");
                $glyph.removeClass("glyphicon-star glyphicon-inbox").addClass("glyphicon-ok-circle");
                wItPop.feed.load("archive");
                break;
        }
        $('#wallabag-nav').collapse('hide');
        return false;
    });

    // -------------------
    // Chrome API
    // --------------------------------

    // Load the settings

    wItPop.loadSettings().done(function ()
    {
        wItPop.feed.update({
            unread: true,
            archive: true,
            fav: true
        });
        wItPop.feed.load("unread");
        $("#wallabagIt-link").attr('href', wItPop.settings.url);
        // $loading.delay(200).hide(0);
    });

    chrome.runtime.onInstalled.addListener(wItPop.options);

    chrome.storage.onChanged.addListener(function (changes)
    {
        var tab = wItPop.tab.selected();

        for (key in changes)
        {
            if (key == "wallabagItUnread" && tab == "unread")
            {
                wItPop.feed.load('unread');
            }

            if (key == "wallabagItArchive" && tab == "archive")
            {
                wItPop.feed.load('archive');
            }

            if (key == "wallabagItFav" && tab == "fav")
            {
                wItPop.feed.load('fav');
            }
        }
    });
});
