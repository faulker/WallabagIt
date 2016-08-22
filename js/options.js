$(function ()
{
    var wItOpt = window.wItOpt = window.wItOpt || {};

    wItOpt.v1       = {};
    wItOpt.v2       = {};
    wItOpt.settings = {
        v1: {},
        v2: {},
        url: '',
        linking: 'wallabag',
        version: 2
    };

    wItOpt.linkOptions = function ()
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

    wItOpt.setLinking = function ()
    {
        var $page     = $("#page-url");
        var $wallabag = $("#wallabag-url");

        switch (wItOpt.settings.linking)
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

    wItOpt.setVersion = function ()
    {
        var btnv1 = $('#opt-wallabag-v1');
        var btnv2 = $('#opt-wallabag-v2');

        switch (wItOpt.settings.version)
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

    wItOpt.loadSettings = function ()
    {
        var loaded = $.Deferred();
        chrome.storage.local.get('wallabagItSettings', function (results)
        {
            if (results.wallabagItSettings != undefined)
            {
                wItOpt.settings = results.wallabagItSettings;

            }
            loaded.resolve(true);
        });
        return loaded.promise();
    };

    wItOpt.updateApiStatus = function(status)
    {
        if (status)
        {
            $("#requirementInfo").removeClass("list-group-item-danger").addClass("list-group-item-success");
            $("#apiStatus").text("Working!");
        }
        else
        {
            $("#requirementInfo").addClass("list-group-item-danger").removeClass("list-group-item-success");
            $("#apiStatus").text("There is an issue with the API settings!");
        }
    };

    wItOpt.checkApiStatus = function(url)
    {
        if(url == undefined || url == '')
        {
            url = wItOpt.settings.url;
        }

        switch(wItOpt.settings.version)
        {
            case '1':
            case 1:
                wItOpt.v1.checkUrl(url).done(function(status)
                {
                    wItOpt.updateApiStatus(status);
                });
                break;
            case '2':
            case 2:
            default:
                wItOpt.v2.checkUrl(url).done(function(status)
                {
                    wItOpt.updateApiStatus(status);
                });
        }
    };

    // Get app version and display it
    var version = chrome.app.getDetails().version;
    $("#version").html("Version: <strong>" + version + "</strong>");

    $(".alert").alert().hide();

    // Save all settings
    $("#save-settings").click(function ()
    {
        var url = $('#api-url').val();
        if(new RegExp(".*\/$", "g").test(url))
        {
            url = url.slice(0, -1);
        }
        wItOpt.settings.url = (/^(http|https):\/\//i.test(url)) ? url : "http://" + url;

        wItOpt.v1.save();
        wItOpt.v2.save();

        chrome.storage.local.set({'wallabagItSettings': wItOpt.settings});

        wItOpt.checkApiStatus(url);
    });

    // Change Wallabag version
    $("input[name='opt-wallabag-api']").change(function ()
    {
        wItOpt.settings.version = $(this).val();
        $('#wallabag-v2').toggle();
        $('#wallabag-v1').toggle();
    });

    // Change linking version
    $("input[name='opt-linking']").change(function ()
    {
        wItOpt.settings.linking = $(this).val();
    });

    // loading settings
    wItOpt.loadSettings().done(function ()
    {
        wItOpt.setVersion();
        wItOpt.setLinking();

        wItOpt.v1.load();
        wItOpt.v2.load();

        wItOpt.checkApiStatus();
    });
});