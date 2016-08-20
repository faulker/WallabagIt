$(function ()
{
    var wIt = window.wIt = window.wIt || {};

    wIt.v1       = {};
    wIt.v2       = {};
    wIt.settings = {
        v1: {},
        v2: {},
        url: '',
        linking: 'wallabag',
        version: 2
    };

    wIt.linkOptions = function ()
    {
        var active = "";
        $(".link-options label").each(function (index)
        {
            if ($(this).hasClass("active"))
            {
                active = $(this).find("input").attr("name");
            }
        });

        switch (active)
        {
            case "opt-wallabag-url":
                return "wallabag";
                break;
            case "opt-page-url":
                return "page";
                break;
            default:
                return "wallabag";
        }
    };

    wIt.setLinking = function ()
    {
        var $page     = $("#page-url");
        var $wallabag = $("#wallabag-url");

        switch (wIt.settings.linking)
        {
            case "page":
                $page.attr('checked', 'checked');
                $page.parent().addClass("active");
                break;
            case "wallabag":
            default:
                $wallabag.attr('checked', 'checked');
                $wallabag.parent().addClass("active");
                break;
        }
    };

    wIt.setVersion = function ()
    {
        var btnv1 = $('#opt-wallabag-v1');
        var btnv2 = $('#opt-wallabag-v2');

        switch (wIt.settings.version)
        {
            case '1':
            case 1:
                btnv1.attr('checked', 'checked');
                btnv1.parent().addClass('active');
                $('#wallabag-v2').hide();
                break;
            case '2':
            case 2:
            default:
                btnv2.attr('checked', 'checked');
                btnv2.parent().addClass('active');
                $('#wallabag-v1').hide();
        }
    };

    wIt.loadSettings = function ()
    {
        var loaded = $.Deferred();
        chrome.storage.local.get('settings', function (results)
        {
            if (results.settings != undefined)
            {
                wIt.settings = results.settings;
            }
            loaded.resolve(true);
        });
        return loaded.promise();
    };

    // Get app version and display it
    var version = chrome.app.getDetails().version;
    $("#version").html("Version: <strong>" + version + "</strong>");

    $(".alert").alert().hide();

    // Save all settings
    $("#save-settings").click(function ()
    {
        var url = $('#api-url').val();
        chrome.storage.local.set({'url_option': wIt.linkOptions()}); // Save link option
        wIt.settings.url = (/^(http|https):\/\//i.test(url)) ? url : "http://" + url;

        wIt.v1.save();
        wIt.v2.save();

        chrome.storage.local.set({'settings': wIt.settings});
    });

    // Change Wallabag version
    $("input[name='opt-wallabag-api']").change(function ()
    {
        wIt.settings.version = $(this).val();
        $('#wallabag-v2').toggle();
        $('#wallabag-v1').toggle();
    });

    // Change linking version
    $("input[name='opt-linking']").change(function ()
    {
        wIt.settings.linking = $(this).val();
    });

    // loading settings
    wIt.loadSettings().done(function ()
    {
        wIt.setVersion();
        wIt.setLinking();

        wIt.v1.load();
        wIt.v2.load();
    });
});