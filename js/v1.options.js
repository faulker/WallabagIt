$(function ()
{
    wItOpt.v1.url = function ()
    {
        var url = $("#url").val();
        var uri = $("#api-folder").val();

        if (url != undefined && uri != undefined)
        {
            return url + '/' + uri + '/';
        }

        return false;
    };

    wItOpt.v1.checkUrl = function (url)
    {
        var checking_api = $.Deferred();
        $.getJSON(url, {o: 'check'}, function (data)
        {
            if (data.api == true)
            {
                checking_api.resolve(true);
            }
        }).fail(function ()
        {
            checking_api.resolve(false);
        });
        return checking_api.promise();
    };

    wItOpt.v1.save = function ()
    {
        var url    = $("#api-url").val();

        wItOpt.settings.v1.folder = $("#api-folder").val() == "" ? 'api' : $("#api-folder").val();
        wItOpt.settings.v1.key    = $('#api-key').val();

        $(".alert").alert().fadeOut().alert().fadeIn();
    };

    wItOpt.v1.load = function ()
    {
        var key    = wItOpt.settings.v1.key;
        var folder = wItOpt.settings.v1.folder;

        $("#api-key").val(key);
        $("#api-folder").val(folder);

        if (wItOpt.settings.url != false)
        {
            $("#api-url").val(wItOpt.settings.url);
        }
    };
});