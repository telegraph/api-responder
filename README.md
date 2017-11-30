# api-responder


<blockquote><strong>Quickly create API endpoints using promises or yield for async operations.. </strong></blockquote>

## Intro

###A 3 way router and server

####1.  A server with options for port, public folder and router config set on command line

```
        $ node server --config  api-config.js' --port 8087

```

####2.  A server module for an app which allows the setting of endpoints in a convenient json config

```
   const port=8067, apiResponder =require('api-responder')
     apiResponder('test-api-config', port)
         .then(responder=>{
	       /* responder: 
	      {
		    app:<app>,
		    server:<server>,
		    config:<config>
	      }*/
      }).catch(err=>{})

```

####3.  A router which can be added to any express app
```
     //  app already exists

        const apiResponder =require('api-responder')
        apiResponder('tests/configs/test-api-config', app)
```


### installation

```
     $ npm install api-responder

 ```    

### Router config

####  Simple Format using defaults

```
      // in external file
      module.exports={
      apis: [
          {
            // Generator based (for async operations)
            endpoint: "/api/v2/data",
            responder: function*() {
              return yield Promise.resolve({
                status: OK,
                data: 56
              });
            }
          },

          // Promise based
          {
            endpoint: "/api/v2/test",
            responder: function*(api, resolve, reject) {
              resolve({
                status: OK,
                data: "test"
              });
            }
          }
        ]
      };
```
####Defaults

  - method: 'get'
  - CORS:  true
  - response_status:  200
  - public: 'public'
  - port: 8081
```

### api-responder API

### Config
```
    { 
        method:'get|post|put|etc',  // default 'get',

        // Promise-based
        responder:  function(api, resolve,reject){
        
        // request data

        // api.body
        // api.query
        // api.cookie
        // api.params
        // api.req
        

        // settings

        // api.res
        // api.response
        // api.response_status 
        // api.filepath - return file
        // api.attachment - true/false
        // api.CORS - true/false
        // api.headers
        },

        // or Generator-based
        responder:  function(){
        let state=this
       
        // request data
        
        // state.body
        // state.query
        // state.cookie
        // state.params
        // state.req
        // state.headers
        

        // settings

        // state.res.status(404)  or
        // state.response_status = 404
        // state.filepath - return file
        // state.attachment - true/false
        // state.CORS - true/false
        },

        // or reverse proxy
        rproxy:{
                url:'http://bbc.co.uk',
                transformRequest:api=>{  //optional

                        // change api or api.rproxy attributes
                        // by reference.  See above for api options
                },
                transformResponse:data=>{  // optional
                    
                    return data;
                }
        }
    }
    ```

    To use a config either pass a relative path to an extrenal file with module.exports=<config> or pass as an argument to apiResponser eg
    ```
        apiResponder({
                port: { ... },
                public: '...',
                defaults:{ ... },
                apis:[ ... ]
        })

    ```
  
   
Promise-based responders


Generator-based responder


Handles GET, POST, PUT, HEAD etc requests
   

Config has nominated public folder

Post body passed to endpoint responder

Params and query objects passed to endpoint responders

By default responder sets CORS header, can be changed as required

If error thrown in responder, response staus is set to 500

Support download of a file attachment 

Reverse proxy endpoints

Reverse proxy endpoints with requestTransform

Reverse proxy endpoints with responseTransform

          
