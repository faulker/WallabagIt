var apiVersion = 0;
var apiURLWorking = false;

function apiFeedURL()
{
    return $( "#url" ).val() + '/' + $( "#apidir" ).val() + '/';
}

function checkApiURL( url )
{
    var checking_api = $.Deferred();
    $.getJSON( url, { o: 'check' }, function( data )
    {
        if(data.api == true)
        {
            apiURLWorking = true;
            apiVersion = data.apiVersion;
            checking_api.resolve( true );
        }
    }).fail(function()
    {
        apiURLWorking = false;
        checking_api.resolve( false );
    });
    return checking_api.promise();
}

function getLinkOption()
{
    var active = "";
    $( ".link-options label" ).each(function( index )
    {
        if( $( this ).hasClass( "active" ) )
        {
            active = $( this ).find( "input" ).attr( "name" );
        }
    });

    switch( active )
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
}

$(document).ready(function()
{
    $( ".alert" ).alert().hide();
    $( "#save_options" ).click(function()
    {
        // Save Wallabag URL
        var url = $( "#url" ).val();
        if( !/^(http|https):\/\//i.test(url) )
        {
            url = "http://" + url;
        }
        $( "#url" ).val(url);
        chrome.storage.local.set({'url': url})
        chrome.storage.local.set({ 'apiKey': $( "#apikey" ).val() }); // Save API key

        // Save API dir
        var api_dir = $( "#apidir" ).val();
        if( api_dir == "" )
        {
            chrome.storage.local.set({ 'apiDir': "api" });
        }
        else
        {
            chrome.storage.local.set({ 'apiDir': api_dir });
        }

        checkApiURL( apiFeedURL() ).done(function( data )
        {
            if( apiURLWorking )
            {
                $( "#requirementInfo" ).removeClass("list-group-item-danger").addClass("list-group-item-success");
                $( "#apiStatus" ).text("API installed and working!");
            }
            else
            {
                $( "#requirementInfo" ).addClass("list-group-item-danger").removeClass("list-group-item-success");
                $( "#apiStatus" ).text("URL is incorrect or API is not installed!");
            }
        });

        chrome.storage.local.set({ 'urlOption': getLinkOption() }); // Save link option

        $( ".alert" ).alert().fadeOut();
        $( ".alert" ).alert().fadeIn();
    });

    var version = chrome.app.getDetails().version;
    $( "#version" ).html( "Version: <strong>" + version +"</strong>" );

    $( "#clear_options" ).click(function()
    {
        chrome.storage.local.clear();
    });
});

document.addEventListener('DOMContentLoaded', function ()
{
    chrome.storage.local.get('url', function(result)
    {
        $( "#url" ).val( result.url );
    });
    
    chrome.storage.local.get('urlOption', function(result)
    {
        switch( result.urlOption )
        {
            case "wallabag":
                $( "#wallabag-url" ).parent().addClass( "active" );
                break;
            case "page":
                $( "#page-url" ).parent().addClass( "active" );
                break;
            default:
                $( "#wallabag-url" ).parent().addClass( "active" );
                break;
        }
    });

    chrome.storage.local.get('apiKey', function(result)
    {
        $( "#apikey" ).val( result.apiKey );
    });

    chrome.storage.local.get('apiDir', function(result)
    {
        $( "#apidir" ).val( result.apiDir );

        checkApiURL( apiFeedURL() ).done(function( data )
        {
            if( apiURLWorking )
            {
                $( "#requirementInfo" ).removeClass("list-group-item-danger").addClass("list-group-item-success");
                $( "#apiStatus" ).text("API installed and working!");
            }
            else
            {
                $( "#requirementInfo" ).addClass("list-group-item-danger").removeClass("list-group-item-success");
                $( "#apiStatus" ).text("URL is incorrect or API is not installed!");
            }
        });
    });
});