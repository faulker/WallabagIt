$(function () {
    // -------------------
    // Init
    // --------------------------------

    $(".alert").alert().hide();

    loadSettings();

    // -------------------
    // Functions
    // --------------------------------

    // Load saved options or use defaults
    function setOtherOptions(settings)
    {
        let display = 'title';
        const $page     = $("#page-url"),
              $wallabag = $("#wallabag-url");

        switch (settings.linking)
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

        if (settings.hasOwnProperty('display'))
        {
            display = settings.display;
        }

        $("#opt-display").val(display);
    }

    // Update the API status check section
    function updateApiStatus(status)
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
    }

    // Check if API is correctly configured
    function checkApiStatus()
    {
        Auth.checkApi().done((token) => {
            updateApiStatus(token);
        });
    }

    // Save settings
    function saveSettings()
    {
        const url     = Settings.formatUrl($('#api-url').val()),
              linking = $("[name=opt-linking]:checked").val(),
              display = $("#opt-display").val(),
              auth    = {
                  id: $('#api-client-id').val(),
                  secret: $('#api-client-secret').val(),
                  username: $('#wallabag-username').val(),
                  password: $('#wallabag-password').val()
              };

        Settings.set('url', url).done(() => {
            checkApiStatus(url);
        });

        Settings.set('linking', linking);
        Settings.set('display', display);

        Settings.set('auth', auth).done(() => {
            $(".alert").alert().show();
        });
    }

    // Load all saved settings
    function loadSettings()
    {
        Settings.getAll().done((results) => {
            if (results.hasOwnProperty('auth'))
            {
                $('#api-client-id').val(results.auth.id);
                $('#api-client-secret').val(results.auth.secret);
                $('#wallabag-username').val(results.auth.username);
                $('#wallabag-password').val(results.auth.password);
            }

            if (results.hasOwnProperty('url'))
            {
                $('#api-url').val(results.url);
                checkApiStatus(results.url);
            }

            if (results.hasOwnProperty('display'))
            {
                $('#opt-display').val(results.display);
            }

            setOtherOptions(results);
        });
    }

    // -------------------
    // Actions
    // --------------------------------

    // Get app version and display it
    $("#version").html("Version: <strong>" + chrome.app.getDetails().version + "</strong>");

    // Save all settings
    $("#save-settings").click(saveSettings);
});
