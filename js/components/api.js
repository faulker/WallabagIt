/**
 * WallabagIt, a chrome extension for Wallabag.
 *
 * @author     Winter Faulk <winter@faulk.me>
 */

class FeedAPI {

    // Get all Wallabag feeds and cache them
    static get()
    {
        let loaded = $.Deferred();

        Auth.token().done((results) => {
            if (results !== false)
            {
                const apiURL = results.url + '/api/entries.json';

                $.get(apiURL, { access_token: results.token }, (entries) => {
                    let tags  = {},
                        items = entries._embedded.items,
                        feeds = {
                            'archive': [],
                            'fav': [],
                            'unread': [],
                        };

                    for (var i in items)
                    {
                        let item = items[i],
                            id   = item['id'];

                        if (item.is_starred === 1)
                        {
                            feeds.fav.push(item);
                        }

                        if (item.is_archived === 1)
                        {
                            feeds.archive.push(item);
                        }
                        else // unread
                        {
                            feeds.unread.push(item);
                        }

                        tags[id] = item.tags;
                    }

                    // Cache feeds and tag results
                    chrome.storage.local.set({
                        'feeds': feeds,
                        'tags': tags
                    });

                    loaded.resolve({ 'feeds': feeds, 'tags': tags });
                }).fail(function (xhr) {
                    loaded.reject(xhr);
                });
            }
            else
            {
                loaded.reject('Failed to get auth token');
            }
        });

        return loaded.promise();
    }

    // Get a cached feed
    static getCache(feed)
    {
        let getFeed = $.Deferred();

        chrome.storage.local.get(['feeds', 'tags'], (results) => {
            if (feed === undefined)
            {
                getFeed.resolve(results);
            }
            else
            {
                getFeed.resolve(results.feeds[feed]);
            }
        });

        return getFeed.promise();
    }
}

class BagAPI {

    // Add a Bag
    static add(url, title)
    {
        let addItem = $.Deferred();

        Auth.token().done((results) => {
            if (results !== false)
            {
                const feedURL = results.url + '/api/entries.json';
                $.post(feedURL, {
                    'url': url,
                    'title': title,
                    'access_token': results.token
                }, function () {
                    addItem.resolve(true);
                }).fail(function (xhr) {
                    addItem.reject(JSON.parse(xhr.responseText));
                });
            }
            else
            {
                addItem.reject('Failed to get auth token');
            }
        });

        return addItem.promise();
    }
}

class TagAPI {

    // Save tags for a bag
    static saveTags(item, tags)
    {
        let addTags = $.Deferred();

        Auth.token().done((results) => {
            if (results !== false)
            {
                const feedURL = results.url + '/api/entries/' + item + '/tags.json';

                $.post(feedURL, {
                    'access_token': results.token,
                    'tags': tags
                }, function () {
                    addTags.resolve(true);
                }).fail(function (xhr) {
                    addTags.reject(xhr.responseText);
                });
            }
            else
            {
                addTags.reject('Failed to get auth token');
            }
        });

        return addTags.promise();
    }

    // Delete a tag from a bag
    static deleteTag(itemId, tagId)
    {
        let delTag = $.Deferred();

        Auth.token().done(function (results) {
            if (results !== false)
            {
                const feedURL = results.url + '/api/entries/' + itemId + '/tags/' + tagId + '.json';

                $.ajax({
                    url: feedURL,
                    method: 'DELETE',
                    data: { 'access_token': results.token },
                    success: function () {
                        delTag.resolve(true);
                    },
                    fail: function (xhr) {
                        delTag.reject(xhr.responseText);
                    }
                });
            }
            else
            {
                delTag.reject('Failed to get auth token');
            }
        });

        return delTag.promise();
    }

    // Get all cached tags
    static get()
    {
        let getTags = $.Deferred();

        chrome.storage.local.get('tags', function (results) {
            getTags.resolve(results.tags);
        });

        return getTags.promise();
    }
}