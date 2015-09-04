// api-reponder ver 0.3
// Stephen Giles

// usage: > node server PPPP  relative-path-to-config
//  PPPP is prefered port  path-to-config optional

var args = process.argv.slice(2),
    express = require('express'),
    fs = require("fs-extra"),
    join = require('path').join,
    _ = require("underscore"),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    request = require('request'),
    
    app = module.exports = express(),
    shell = require('shelljs'),
    cookieParser=require('cookie-parser'),
    setPort=function(args){

        return  process.env.PORT || args[0] || apiResponder.config.port || 4512;
    },
    apiPromise,




    // api is passed in by reference and so is updated by this method
    apiResponder = {
        config: require(join(__dirname, args[1] || 'api-config.js')),

        initialize: function() {
            var lsof, port = apiResponder.port,
                listen = function() {
                    // allow posts up to 50MB in size
                    app.use(bodyParser.json({
                        limit: '50mb'
                    }));
                    app.use(bodyParser.urlencoded({
                        limit: '50mb',
                        extended: true
                    }));
                    app.use(multer()); // for parsing multipart/form-data

                    // provides req.cookies
                    app.use(cookieParser());

                    // serve everything in 'public' folder as static files
                    app.use(express.static((typeof apiResponder.config === 'object' && apiResponder.config.public) || 'public'));
                    app.listen(port, '0.0.0.0', function() {
                        console.log("Responder listening on port %d", port);
                        apiResponder.initializeController();
                    });
                };

            // check if port alreay in use
            lsof = shell.exec('lsof -i :' + port, function(id, output) {
                if (output.split('\n').length > 1) {
                    pid = output.split("\n")[1].replace(/\s+/g, "|").split("|")[1];
                    kill = shell.exec('kill -9 ' + pid, function() {
                        console.log('Killing process ' + pid + ' already usng port ' + port);
                        listen();
                    });
                } else {
                    listen();
                }
            });
        },

        initializeController: function() {
            var config = apiResponder.config;
            if (config.apis.length) {
                console.log(config.apis.length ? 'Initialising responses:' : 'No responses defined yet');
            }

            // add a router for each api response in config
            _.each(config.apis, function(route, index) {
                console.log('  ' + (index + 1) + '. ' + (route.method || config.defaults.method) + ' ' + route.endpoint);
                var method = (route.method || config.defaults.method).toLowerCase();

                // eg app.get('/webapi/api/v1/client/leadData',function(){ ... })
                app[method](route.endpoint,
                    function(req, res) {

                        // add in default values
                        var timer = new Date().getTime(),
                            api = _.extend(
                                _.clone(config.defaults),
                                config.apis[index],

                                // pass request query string and post body (if any) to responder method
                                _.pick(req, ['query', 'body', 'params','cookies']), {
                                    req: req,
                                    res: res
                                }
                            );

                        // run the api.responder method (sets api.response and may amend api.response_status)
                        // or apply the reverse proxy specification to 'request'
                        apiPromise = typeof api.rproxy === 'object' ? apiResponder.getReverseProxy(api) :
                            new Promise(function(resolve, reject) {

                                // allow api responders to use the getProxy syntax
                                // by passing reference to it
                                api.getReverseProxy = apiResponder.getReverseProxy;
                                try {
                                    api.responder.apply(this, [api, resolve, reject]);
                                } catch (e) {
                                    reject(e);
                                }
                            });

                        apiPromise.then(function(response) {
                            if(response!==undefined){
                                api.response=response;
                            }
                            timer = new Date().getTime() - timer;
                            setTimeout(function() {

                                // send the response
                                // add CORS header to allow cross-domain access to responder
                                if (api.CORS) {
                                    res.header("Access-Control-Allow-Origin", "*");
                                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                                }

                                // if response is a file the api-config should set api.type and api.filepath
                                // corresponding to requested file 
                                if (api.filepath) {
                                    if (!api.type && api.filepath.lastIndexOf('.') !== -1) {
                                        api.type = api.filepath.substr(api.filepath.lastIndexOf('.') + 1);
                                    }
                                    fs.readFile(api.filepath, function(err, file) {

                                        // sets mime-type
                                        res.type(api.type);
                                        if (api.attachment) {

                                            // sets content disposition and mime-type
                                            // eg Content-Disposition: attachment; filename="xxx.pdf"
                                            res.attachment(api.filepath);
                                        }
                                        res.status(api.response_status).send(file);
                                    });
                                } else {
                                    if (api.type){
                                        res.type(api.type);
                                    }
                                    res.status(api.response_status).send(api.response);
                                }
                            }, Math.max(0, api.response_time - timer));
                        }).catch(function(err) {
                            if (typeof api.error_responder === 'function') {
                                api.error_responder();
                                res.status(api.response_status).send(api.error_response);
                            } else {
                                res.status(500).send(err.toString() || '');
                            }
                        });
                    });
            });
        },

        getReverseProxy: function(api, rproxy) {
            var config = apiResponder.config;
            return new Promise(function(resolve, reject) {
                if (rproxy === undefined && typeof api.rproxy === 'object') {
                    rproxy = api.rproxy;
                }

                // fill in any missing details of the proxy request from the express req object
                rproxy.url = rproxy.url || api.req.path;
                rproxy.qs = rproxy.qs || _.extend(api.req.query, rproxy.baseQuery || {});
                rproxy.method = rproxy.method || api.req.method;
                rproxy.baseUrl = rproxy.baseUrl || config.rproxy_defaults.baseUrl;

                // headers priority order: 
                // 1. headers specified in api definition; 2. specified in config defaults; 3. headers supplied by 'req'

                rproxy.headers = _.extend(

                    // filtered req headers
                    _.omit(_.clone(api.req.headers), config.rproxy_defaults.rproxy_headers_omit || []),

                    // any default headers
                    config.rproxy_defaults.headers,

                    // any headers specified in api config
                    rproxy.headers || {}
                );
                if (rproxy.method === 'POST') {
                    if (api.req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                        rproxy.form = api.req.body;
                        
                    }
                    /*  // multipart
                    else if (api.req.headers['content-type'] === 'multipart/form-data') {
                                    rproxy.multipart = TBA;
                                } 
                    */
                    else {
                        rproxy.body = rproxy.body || api.req.body;
                        if (typeof rproxy.body === 'object') {
                            rproxy.json = true;
                        }
                    }
                }

                // apply the rproxy object to 'request' and feed back the response
                // including the reponse headers and status code
                request(rproxy, function(err, response, body) {

                    if (err) {
                        reject(err);
                    } else {
                        api.response_status = response.statusCode;
                        _.each(response.headers, function(value, attr) {
                            api.res.setHeader(attr, value);
                        });
                        api.response = body;
                        resolve(body);
                    }
                });
            });
        }
    };




if (require.main === module) {
    apiResponder.port = setPort(args);
    apiResponder.initialize();
}


module.exports = function(listenOn, configFile) {
    var port_set;
    _(arguments).each(function(arg) {
        if (typeof arg === 'number') {
            port_set = true;
            apiResponder.port = arg;
        }
        if (!isNaN(parseInt(arg, 10))) {
            apiResponder.port = parseInt(arg, 10);
            port_set = true;
        }
        else if (typeof arg === 'string') {

            // overwrite default config
            apiResponder.config = require(join(__dirname, arg));
        }

        if (arg && typeof arg === 'object') {
            if (arg.port) {
                apiResponder.port = arg.port;
                port_set = true;

                // overwrite default config
                apiResponder.config=arg;
            }
        }
    });
    if (process.env.PORT){
         apiResponder.port = process.env.PORT;
         port_set=true;
    }
    if (!port_set) {
        apiResponder.port = setPort(args);
    }
    apiResponder.initialize();
    return apiResponder;

};

