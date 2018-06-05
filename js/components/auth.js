/**
 * WallabagIt, a chrome extension for Wallabag.
 *
 * @author     Winter Faulk <winter@faulk.me>
 */

class Auth {

    // Get the Auth token
    static token()
    {
        let loaded = $.Deferred();
        Settings.getAll().done((settings) => {
            if(settings.hasOwnProperty('url'))
            {
                const auth = settings.auth,
                      url  = settings.url,
                      data = {
                          grant_type: 'password',
                          client_id: auth.id,
                          client_secret: auth.secret,
                          username: auth.username,
                          password: auth.password
                      };

                if (url.length > 0 && Object.getOwnPropertyNames(auth).length > 0)
                {
                    $.post(url + '/oauth/v2/token', data, function (token) {
                        loaded.resolve({ 'token': token, 'url': url });
                    }).fail(function () {
                        loaded.resolve(false);
                    });
                }
                else
                {
                    loaded.resolve(false);
                }
            }
            else
            {
                loaded.resolve(false);
            }
        });

        return loaded.promise();
    }

    // Check to see if a request can be made to the API URL
    static checkApi()
    {
        let checking_api = $.Deferred();
        this.token().done((token) => {
            checking_api.resolve(token);
        });

        return checking_api.promise();
    }
}