/**
 * WallabagIt, a chrome extension for Wallabag.
 *
 * @author     Winter Faulk <winter@faulk.me>
 */
$(function () {
    // -------------------
    // Init
    // --------------------------------
    let cache       = {},
        currentFeed = 'unread';

    const $wallabags = $('#wallabags'),
          $openOpt   = $('.open-options'),
          $tab       = $('#selected-tab'),
          $glyph     = $('#selected-glyph'),
          $error     = $('#error-img'),
          $loading   = $('#loading-img');

    $.ajaxSetup({ cache: false }); // Stop the getJSON calls from caching the results.

    // If there is cached feed data build the feed from it to start
    FeedAPI.getCache().done((results) => {
        if (Object.keys(results).length > 0 && results.constructor === Object)
        {
            cache.feeds = results['feeds'];
            buildFeed('unread');
        }
    });

    // Updated the cached data and rebuild the feed once finished
    updateAndRebuildFeed();

    // -------------------
    // Functions
    // --------------------------------

    // Show a modal window to list and manage the tags for a bag
    function buildTags()
    {
        TagAPI.get().done((results) => {
            let $modal   = $('#tags-modal'),
                id       = $(this).attr('data-id'),
                tags     = $(results[id]),
                tagCloud = [];

            if (tags.length > 0)
            {
                tags.each(function (index, tag) {
                    tagCloud.push(
                        '<div class="tag-entry">',
                        '<strong>' + tag.label + '</strong>',
                        '<button type="button" class="tag-remove" data-id="' + tag.id + '"><span class="glyphicon glyphicon-trash"></span></a>',
                        '</div>'
                    );
                });

                $modal.find('#tags-list').html(tagCloud.join("\n"));
            }

            $modal.find('#item-tags').val('');
            $modal.find('#item-id').val(id);
            $modal.modal('show');
        });
    }

    // Build the current feed
    function buildFeed($feed)
    {
        $error.hide();

        if (cache.hasOwnProperty('feeds') && cache.feeds.hasOwnProperty($feed))
        {
            const $bagList = $("#wallabags-body"),
                  feed     = $(cache.feeds[$feed]);

            Settings.get(['url', 'linking', 'display']).done((results) => {
                const scrollCache = $bagList.scrollTop;
                $bagList.empty();
                feed.each((key, data) => {
                    let item = loadFeedItems(data, results);
                    $("#wallabags-body").append(item);
                });

                $bagList.scrollTop(scrollCache);
            });
        }
    }

    // Build the HTML for one item in the feed
    function loadFeedItems(data, options)
    {
        let shortTitle    = data.title,
            favKlass      = "unflagged",
            archivedKlass = "unflagged",
            id            = data.id,
            title         = data.title,
            fav           = data.is_starred,
            archived      = data.is_archived,
            htmlItem      = ["<tr id='" + id + "' class='bags'>",],
            url,
            shortUrl;

        switch (options.linking)
        {
            case "page":
                url = data.url;
                break;
            case "wallabag":
            default:
                url = options.url + '/view/' + id;
                break;
        }

        shortUrl = url;

        if (title.length > 50)
        {
            shortTitle = title.substr(0, 47) + "...";
        }

        if (fav === 1)
        {
            favKlass = "flagged";
        }

        if (archived === 1)
        {
            archivedKlass = "flagged";
        }

        switch (options.display)
        {
            case 'url':
                if (url.length > 50)
                {
                    shortUrl = url.substr(0, 47) + "...";
                }

                htmlItem.push(
                    "<td class='links'><a href='" + url + "' title='" + title + "'>" + shortUrl + "</a></td>",
                );
                break;
            case 'title_url':
                if (url.length > 59)
                {
                    shortUrl = url.substr(0, 56) + "...";
                }

                htmlItem.push(
                    "<td class='links'>",
                    "<a href='" + url + "' title='" + title + "\n" + url + "'>",
                    shortTitle,
                    "<br/>",
                    "<small class='small-url'>" + shortUrl + "</small>",
                    "</a>",
                    "</td>",
                );
                break;
            case 'title':
            default:
                htmlItem.push(
                    "<td class='links'><a href='" + url + "' title='" + title + "\n" + url + "'>" + shortTitle + "</a></td>",
                );
        }

        htmlItem.push(
            "<td class='actions'>",
            "<span class='glyphicon glyphicon-ok " + archivedKlass + "' data-id='" + id + "' data-status='" + archived + "' title='Archive it'></span>",
            "<span class='glyphicon glyphicon-star " + favKlass + "' data-id='" + id + "' data-status='" + fav + "' title='Add to favorites'></span>",
            "<span class='glyphicon glyphicon-remove unflagged' data-id='" + id + "' title='Remove it'></span>",
            "<span class='glyphicon glyphicon-tags unflagged' data-id='" + id + "' title='Tags'></span>",
            "</td>",
            "</tr>"
        );

        return htmlItem.join('\n');
    }

    // Archive or favorite a bag
    function changeItem(opt, id, status)
    {
        if (opt === "archive")
        {
            $('#' + id).remove();
        }

        Auth.token().done((results) => {
            const feedURL = results.url + '/api/entries/' + id + '.json';
            let data = {
                'access_token': results.token
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
                success: function () {
                    updateAndRebuildFeed();
                }
            });
        });

        return true;
    }

    // Remove a bag
    function removeFeedItem(id)
    {
        $('#' + id).remove();

        Auth.token().done((results) => {
            const feedURL = results.url + '/api/entries/' + id + '.json';

            $.ajax({
                url: feedURL,
                method: 'DELETE',
                data: { 'access_token': results.token },
                success: function () {
                    updateAndRebuildFeed();
                }
            });
        });
    }

    // Open the options window
    function options()
    {
        var options_url = chrome.extension.getURL("options.html");
        chrome.tabs.create({ url: options_url });
    }

    // Sync the feeds with what is on the server and rebuild the current
    // feed from the data
    function updateAndRebuildFeed()
    {
        $loading.show();
        FeedAPI.get().done((results) => {
            cache = results;

            buildFeed(currentFeed);
            $loading.delay(200).hide(0);
        }).fail(() => {
            options();
        });
    }

    // Add a new bag to Wallabag
    function addPage()
    {
        chrome.tabs.query({
            'active': true,
            'currentWindow': true
        }, function (tabs) {
            const tablink = tabs[0].url,
                  title   = tabs[0].title;

            $('#add-link').html("<span class='glyphicon glyphicon-file'></span> Adding...");
            BagAPI.add(tablink, title).done(() => {
                $('#add-link').html("<span class='glyphicon glyphicon-file'></span> Add Page");
                updateAndRebuildFeed();
            }).fail((status) => {
                $error.show().attr('title', "Sorry, something went wrong! " + status.error_description);
            });
        });
    }

    // Save new tags added to a bag
    function saveTags()
    {
        let $modal = $('#tags-modal'),
            tags   = $modal.find('#item-tags').val(),
            item   = $modal.find('#item-id').val();

        TagAPI.saveTags(item, tags).done((result) => {
            if (result)
            {
                updateAndRebuildFeed();
            }
        });

        $modal.modal('hide');
    }

    // -------------------
    // Actions
    // --------------------------------

    $('.wallabag-link').tooltip();
    $openOpt.tooltip();

    // Handle tag actions
    $('#btn-tags-save').click(saveTags);

    $('body').on('click', '.tag-remove', function (e) {
        const tagId  = $(this).data('id'),
              itemId = $('#item-id').val();

        TagAPI.deleteTag(itemId, tagId);

        updateAndRebuildFeed();

        $(this).parent().remove();
    });

    // Add bag
    $('#add-link').click(addPage);

    // Handle bag changes, archiving, deleting, etc.
    $wallabags.on('click', '.glyphicon-ok', function () { // Archive
        const id        = $(this).data('id'),
              status    = $(this).data('status'),
              newStatus = (status === 0) ? 1 : 0;

        changeItem("archive", id, newStatus);
        $(this).data('status', newStatus);

        return false;
    }).on('click', '.glyphicon-star', function () { // Fav
        let id        = $(this).data('id'),
            status    = $(this).data('status'),
            newStatus = (status === 0) ? 1 : 0;

        changeItem("fav", id, newStatus);
        $(this).data('status', newStatus);
        $(this).toggleClass('flagged').toggleClass('unflagged');

        return false;
    }).on('click', '.glyphicon-remove', function () { // Remove
        const id = $(this).attr('data-id');
        removeFeedItem(id);
        return false;
    }).on('click', 'a', function () { // Open
        chrome.tabs.create({ url: $(this).attr('href') });
        return false;
    }).on('click', '.glyphicon-tags', buildTags); // Show tags modal

    // Open the options page
    $openOpt.on('click', options);

    // Open Bag
    $('.link').on('click', function () {
        chrome.tabs.create({ url: $(this).attr('href') });
        return false;
    });

    // Change what feed is loaded (Unread, Favorite, Archive)
    $('.nav').on('click', 'li', function (e) {
        currentFeed = $(this).data('link');

        $('.nav li').each(function () {
            $(this).removeClass('active');
        });

        $(this).addClass('active');

        switch (currentFeed)
        {
            case "unread":
                $tab.text("Unread");
                $glyph.removeClass("glyphicon-star glyphicon-ok-circle").addClass("glyphicon-inbox");
                buildFeed("unread");
                break;
            case "fav":
                $tab.text("Favorites");
                $glyph.removeClass("glyphicon-inbox glyphicon-ok-circle").addClass("glyphicon-star");
                buildFeed("fav");
                break;
            case "archive":
                $tab.text("Archive");
                $glyph.removeClass("glyphicon-star glyphicon-inbox").addClass("glyphicon-ok-circle");
                buildFeed("archive");
                break;
        }
        $('#wallabag-nav').collapse('hide');
        return false;
    });

    // -------------------
    // Chrome API
    // --------------------------------

    // Current the wallabag server URL and set the wallabag herf
    Settings.get('url').done(function (results) {
        $("#wallabagIt-link").attr('href', results.url);
    });

    // Load feed depending on what tab is selected
    chrome.storage.onChanged.addListener(function (changes) {
        for (key in changes)
        {
            if (key == "wallabagItUnread" && currentFeed == "unread")
            {
                loadFeed('unread');
            }

            if (key == "wallabagItArchive" && currentFeed == "archive")
            {
                loadFeed('archive');
            }

            if (key == "wallabagItFav" && currentFeed == "fav")
            {
                loadFeed('fav');
            }
        }
    });
});
