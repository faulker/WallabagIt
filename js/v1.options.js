$(function ()
{
    wIt.v1.urlWorking = false;

    wIt.v1.url = function ()
    {
        var url = $("#url").val();
        var uri = $("#api-folder").val();

        if (url != undefined && uri != undefined)
        {
            return url + '/' + uri + '/';
        }

        return false;
    };

    wIt.v1.checkUrl = function (url)
    {
        if (url != false)
        {
            var checking_api = $.Deferred();
            $.getJSON(url, {o: 'check'}, function (data)
            {
                if (data.api == true)
                {
                    wIt.v1.urlWorking = true;
                    checking_api.resolve(true);
                }
            }).fail(function ()
            {
                wIt.v1.urlWorking = false;
                checking_api.resolve(false);
            });
            return checking_api.promise();
        }

        return false;
    };

    wIt.v1.save = function ()
    {
        var url    = $("#api-url").val();
        var apiUrl = wIt.v1.url();

        wIt.settings.v1.folder = $("#api-folder").val() == "" ? $("#api-folder").val() : 'api';
        wIt.settings.v1.key    = $('#api-key').val();

        if (apiUrl != false)
        {
            wIt.v1.checkUrl(apiUrl).done(function ()
            {
                if (wIt.v1.urlWorking())
                {
                    $("#requirementInfo").removeClass("list-group-item-danger").addClass("list-group-item-success");
                    $("#apiStatus").text("API installed and working!");
                }
                else
                {
                    $("#requirementInfo").addClass("list-group-item-danger").removeClass("list-group-item-success");
                    $("#apiStatus").text("URL is incorrect or API is not installed!");
                }
            });
        }

        $(".alert").alert().fadeOut().alert().fadeIn();
    };

    wIt.v1.load = function ()
    {
        var key    = wIt.settings.v1.key;
        var folder = wIt.settings.v1.folder;

        $("#api-key").val(key);
        $("#api-folder").val(folder);

        if (wIt.settings.url != false)
        {
            $("#api-url").val(wIt.settings.url);
            wIt.v1.checkUrl(wIt.settings.url).done(function (data)
            {
                if (wIt.v1.urlWorking)
                {
                    $("#requirementInfo").removeClass("list-group-item-danger").addClass("list-group-item-success");
                    $("#apiStatus").text("API installed and working!");
                }
                else
                {
                    $("#requirementInfo").addClass("list-group-item-danger").removeClass("list-group-item-success");
                    $("#apiStatus").text("URL is incorrect or API is not installed!");
                }
            });
        }
    };
});