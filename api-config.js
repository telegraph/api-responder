var HTTPcodes = require('http-status-codes'),
    request = require('request'),
    join = require('path').join,
    fs = require("fs"),
   
    locals = {
        __mockdir: function(filename) {
            return join(__dirname, 'mock-data', filename);
        }
    },
    defaults = {
        response_status: 200,
        response_time: 700,
        method: 'POST',
        attachment: false,
        filename: '',
        type: '',
        CORS: true

    },
    rproxy_defaults = {

        // a default base url can be set which reverse proxy requests are sent.
        baseUrl: '',

        // default headers can be set here, 
        headers: {

            // eg:
            //     host: 'in-brief.com',
            //     'cache-control': 'max-age=0',
            //     accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            //     origin: 'http://localhost:4512',
            //     'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36',
            //     'content-type': 'application/x-www-form-urlencoded',
            //     referer: 'http://localhost:4512/form-test.html', 
            //     'accept-encoding': 'gzip, deflate, sdch',
            //     'accept-language': 'en-GB,en-US;q=0.8,en;q=0.6',
            //     cookie: ''
        },

        // otherwise the 'req' headers will be used but omitting those listed below:
        rproxy_headers_omit: ['host', 'accept-encoding']
    };



module.exports = {
    defaults: defaults,
    locals: locals,
    public: 'optimize',
    rproxy_defaults: rproxy_defaults,
    apis: [

        // ------------------------

        // respond with HTML string

        // ------------------------
        {
            endpoint: '/index.html',
            method: 'GET',
            responder: function(api, resolve) {
                api.response_status = 200;
                api.response = '<body style="color:navy;background-color:#eee;font: 12pt sans-serif"><h2>API RESPONDER</h2></body>';
                resolve();
            }
        }, 


        // ----------------------------------------

        // respond with file in mock data directory

        // -----------------------------------------

        {
            endpoint: '/experiment.js',
            method: 'GET',
            responder: function(api, resolve) {
                api.response='';
                resolve();
            }
        }

    ]
};



/*
COOKIE get and set

// api.cookies()

object on name value pairs

// api.res.cookie(name,value,options);

options:

domain  String  Domain name for the cookie. Defaults to the domain name of the app.
expires Date    Expiry date of the cookie in GMT. If not specified or set to 0, creates a session cookie.
httpOnly    Boolean Flags the cookie to be accessible only by the web server.
maxAge  String  Convenient option for setting the expiry time relative to the current time in milliseconds.
path    String  Path for the cookie. Defaults to “/”.
secure  Boolean Marks the cookie to be used with HTTPS only.
signed  Boolean Indicates if the cookie should be signed.


*/
