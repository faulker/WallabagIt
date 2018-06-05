/**
 * WallabagIt, a chrome extension for Wallabag.
 *
 * @author     Winter Faulk <winter@faulk.me>
 */

chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        id: 'wallabagit',
        title: 'Add to Wallabag',
        type: 'normal',
        contexts: ['page', 'link', 'frame']
    });
});

chrome.contextMenus.onClicked.addListener(function (item, tab) {
    BagAPI.add(tab.url, tab.title).done(() => {
        FeedAPI.get();
    });
});

