# api-responder


<blockquote><strong>Quickly create API endpoints using generators/yield,  async/await or promises for async operations. Includes file-per-endpoint and reverse-proxy options</strong></blockquote>

<blockquote><strong>From version 1.2 supports responders using   async/await from anonymous or named classes as well as generators/yield or promises for async operations.</strong></blockquote>

## Intro

[github](https://github.com/ingenious/api-responder)  see also [async-methods](https://github.com/ingenious/async-methods)

[npm](https://www.npmjs.com/package/api-responder)


<blockquote> In version 1.1.x Now supports async/await in anonymous or names classes </blockquote>

### A 4 way router and server

#### 1.  A quick server with options for port, public folder and router config set on command line

```
                                                        
        $ node server --config  'api-config.js' --port 8087
  
```

#### 2.  A server module for an app which allows the setting of endpoints in a convenient json config

```
                                                                        
   const port=8067, 
   apiResponder =require('api-responder')
   
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

#### 3.  A router which can be added to any express app

```
                                                                        
     //  'app' already exists in application

        const apiResponder =require('api-responder')
        apiResponder('tests/configs/test-api-config', app)
    
```

#### 4.  A file-per-endpoint app server with routing determined by directory tree

```

     // config 
     module.exports = {
         port: 8081,
         auto: 'endpoints',
         public: 'tests/public'
     }

    // sample directory  tree

    endpoints
      v1
        location
          city
            type.js
          update
            post.js    
       
    // auto-generates endpoints:

    1. get /v1/location/:city/type
    2. post /v1/location/update/
                                                           
     //  sample response  from http://localhost:8081/v1/location/Paris/type?a=45&b=67

     
    {city:Paris}
  
```

### installation

```
                                                                        
     $ npm install api-responder -P
  
```    

### Router config

#### Simple Format using defaults

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

          // or Promise based
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

#### Defaults

  - method: 'get'
  - CORS:  true
  - response_status:  200
  - public: 'public'
  - port: 8081


## api-responder API

### Routing Config

see **/tests/test-app-external-config.js**

#### 1. Promise-based responder

```
                                                                        
    { 
        method:'get|post|put|etc',  // default 'get',
        endpoint:'/v1/test/location',
       
        
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
        // api.filepath - return file contents
        // api.attachment - true/false - file as download
        // api.CORS - true/false
        // api.headers
        },

```

#### or 2.  Generator-based responder

```
        // 
       { 
        method:'get|post|put|etc',  // default 'get',
        
        endpoint:'/v1/test/location',  responder:  function(){
       
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
```
 
#### or 3a.  Class based responders - using async/await (state is passed in context - see generator based responders)
```   
       
  { 
   method:'get|post|put|etc',  // default 'get',
     
   endpoint: '/testClass',  
   responder: class {
        constructor() {}
        async testClass() {
          let state = this
          return await Promise.resolve(
             { method: 89, headers:     state.headers }
          )
        }
      },
   methodName: 'testClass'
   
```
#### or 3a.  newed-Class based responders - using async/await (an 'api' argument is passed to the responding method definition - see attributes under promise-based responders)

```

{
      endpoint: '/testClassObject',
      responder: new class {
        constructor() {}
        async test(api) {
          return await api.headers
        }
      }(),
      methodName: 'test'
    },


```

#### or 4. reverse proxy


```
     rproxy:{
        url:'http://bbc.co.uk',
        transformRequest:api=>{  //optional
           // change api (eg set api.CORS) or api.rproxy 
          // attributes by reference.  
          // See above for api options
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

#### Promise-based responders

```
                                                                        
    {apis:{ 
        method:'get|post|put|etc',  // default 'get',
         endpoint:'/v1/test/location',
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
        },{ .. },{ .. }
      ]
    }
  
```

#### Generator-based responder

```
                                                                        
    {apis:  { 
        method:'get|post|put|etc',  // default 'get',
         endpoint:'/v1/location/:city',
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
        },{ .. },{ .. }
      ]
    }
  
```

#### Config has nominated public folder

```
                                                                        
    {
      ..
      public:'dist',
      ..
    }
  
```

#### Post body passed to endpoint responder

```
                                                                        
    apis:[{
      ..
      ..
      method:'post',
      responder: function*(){
        let state-this, body=state.body, response

        // do something async with post body

        return response
      }
    },{
      ..
      ..
      method:'post',
      responder: (api,resolve)=>{
        let response, body=api.body

        // do something async with post body

        resolve(responde)
      }


    }]
  
```

### Params and query objects passed to endpoint responders

```
                                                                        
    {
      endpoint: '/genparams/:field',
      responder: function*() {
        let state = this
        return yield {
          params: state.params,
          query: state.query
        }
      }
    }
  
```

  localhost:8081//genparams/London?a=456&b=67

  returns: {params:{field:'London'},query:{a:456,b:67}}


#### By default responder sets CORS header, can be changed as required

```
                                                                        
    {
      endpoint: '/noCORS',
      CORS: false,
      responder: function(api, resolve) {
        resolve({ test: 67 })
      }
    },
  
```

localhost:8081//noCORS

will not have CORS header in response

#### If error thrown in responder, response status is set to 500


```
                                                                        
   // returns status code 500

   {
      endpoint: '/throw',
      responder: function*() {
        let state = this
        throw { error: 67 }

        return yield am({ test: 98 })
      }
    },
   
```

#### Support download of a file attachment 

```
                                                                        
    {
      endpoint: '/download',
      responder: function(api, resolve) {
        api.filepath = join(__dirname, '../LeavingEden.mp3')
        api.type = 'audio/mpeg'
        api.attachment = resolve()
      }
    }
  
```

#### File per endpoint (auto-configure routes)

Routing can be fully or partly determined by directory tree.  (mix and match with apis:[{..},{..}] configuration)

Specify a top-level directory to hold the paths and specify it in the config as auto:<path>

Default method is get, to configure post, put or head responders use a  ../post.sj, ../put.js or ../head.js for the module filenames



```

    // sample directory  tree
                                                        
    endpoints
      v1
        location
          city
            type.js
          update
            post.js    
       
    // auto-generates endpoints:

    1. get /v1/location/:city/type
    2. post /v1/location/update/
                                          
```

Sample response  from http://localhost:8081/v1/location/Paris/type?a=45&b=67

```
                                                        
    {city:'Paris'}
  
```

### Add an additional public folder

```
                                                         
        apiResponder({
                port: 8081,
                public: 'public',
                apis:[ ... ]
        }).addPublic('tests/dist')
  
```
#### Reverse proxy endpoints

```
                                                                 
    {
      endpoint: '/bbc*',
      rproxy: function(api) {
        return {
          url: api.req.url.replace('/bbc', ''),
          baseURL: 'http://bbc.co.uk'
        }
      }
  
```

#### Reverse proxy endpoints with transformRequest

```
                                                                        
  {
      // change method in reverse proxy using transformRequest
      endpoint: '/iplayer*',
      method: 'POST',
      rproxy: function(api) {
        return {
          url: api.req.url,
          baseURL: 'http://bbc.co.uk'
        }
      },
      transformRequest: function(api) {
        api.meethod = 'GET'
      }
    }
  
```

#### Reverse proxy endpoints with transformResponse

```
                                                                        
    {
      endpoint: '/newsapi/sources',
      rproxy: {
        url: 'https://newsapi.org/v2/sources',
        params: { apiKey: 'c13f0b7040a0461397c250f1c94233d0' }
      },
      transformResponse: function*(data) {
        return yield data.sources
      }
    }
  
```

##  CLI


```
                                                                           -
     $  node server
  
```

Uses port, public folder and api config set in server.js

```

    [router] Responder listening on port 8081
    [router] Static files in /Users/stephen/projects/github/api-responder/public

     1. get /v1/location/:city/type
     2. post /v1/location/update/
  
```



### Optional arguments --config --port  --public

```

   $   node server  --config tests/configs/test-api-config.js  --port 5000 --public  './'
  
```

Sets port to 5000 sets public directory to current and uses api config file  tests/configs/test-api-config.js

```

    [router] Responder listening on port 5000
    [router] Static files in /Users/stephen/projects/github/api-responder/

     1. GET /test
     2. GET /testClass
     3. GET /testClassObject
     4. GET /testClassConstructor
     5. GET /noCORS
     ..
     ..
  
```


## Tests

              
There are automated tests for all the above features

```
  $ npm test
  
  # or
                                  
  $ mocha tests

  #  or
  
  $ nyc mocha tests
  
```

