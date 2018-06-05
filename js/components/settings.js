/**
 * WallabagIt, a chrome extension for Wallabag.
 *
 * @author     Winter Faulk <winter@faulk.me>
 */

class Settings {

    // Get all settings
    static getAll()
    {
        let loaded = $.Deferred();

        chrome.storage.local.get(null, function (result) {
            loaded.resolve(result);
        });

        return loaded.promise();
    }

    // Get one or more settings
    static get(field)
    {
        let loaded = $.Deferred();

        chrome.storage.local.get(field, function (result) {
            loaded.resolve(result);
        });

        return loaded.promise();
    }

    // Save a setting
    static set(field, value)
    {
        let loaded = $.Deferred(),
            settings = {};

        settings[field] = value;

        chrome.storage.local.set(settings, () =>
        {
            loaded.resolve(true);
        });

        return loaded.promise();
    }

    // Format the Wallbag URL
    static formatUrl(url)
    {
        if (new RegExp(".*\/$", "g").test(url))
        {
            url = url.slice(0, -1);
        }

        return (/^(http|https):\/\//i.test(url)) ? url : "http://" + url;
    }
}