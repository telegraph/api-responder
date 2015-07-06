console.log('Using test API config');
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
        rproxy_headers_omit:['host','accept-encoding']
    };



module.exports = {
    defaults: defaults,
    locals: locals,
    rproxy_defaults:rproxy_defaults,
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
            endpoint: '/A.pdf',
            method: 'GET',
            responder: function(api, resolve) {
                api.filepath = locals.__mockdir('e8255_k00B_me173X_em.pdf');
                resolve();
            }
        },

        // ----------------------------------------

        // reverse proxy with dynamic querystring 

        // -----------------------------------------


        {
            endpoint: '/search',
            method: 'GET',
            rproxy: {
                baseUrl: 'http://content.guardianapis.com',
                baseQuery: {
                    'api-key': 'wbyprvxg9ysyyykk3zvh7j8v'
                }
            }
        },

        // ----------------------------------------

        // reverse proxy called from responder

        // -----------------------------------------


        {
            endpoint: '/search1',
            method: 'GET',
            responder: function(api, resolve, reject) {
                api.getReverseProxy(api, {
                    baseUrl: 'http://content.guardianapis.com',
                    url: 'search',
                    baseQuery: {
                        'api-key': 'wbyprvxg9ysyyykk3zvh7j8v'
                    }
                }).then(resolve).catch(reject);
            }
        },

        // ----------------------------------------

        // form submit

        // -----------------------------------------


        {
            endpoint: '/submit',
            responder: function(api, resolve, reject) {
                api.response = api.body;
                resolve();
            }
        }


    ]
};
