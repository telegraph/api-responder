let am = require('async-methods'),
  join = require('path').join
module.exports = {
  port: 8081,
  auto: 'endpoints',
  public: 'tests/public',
  apis: [
    {
      endpoint: '/test',
      responder: function(api, resolve) {
        resolve({ test: 67 })
      }
    },
    {
      endpoint: '/noCORS',
      CORS: false,
      responder: function(api, resolve) {
        resolve({ test: 67 })
      }
    },
    {
      endpoint: '/download',

      responder: function(api, resolve) {
        api.filepath = join(__dirname, '../LeavingEden.mp3')
        api.type = 'audio/mpeg'
        api.attachment = resolve()
      }
    },
    {
      endpoint: '/post',
      method: 'post',
      responder: function*(api, resolve, reject) {
        return this.body
      }
    },
    {
      endpoint: '/put',
      method: 'put',
      responder: function*(api, resolve, reject) {
        return this.body
      }
    },
    {
      endpoint: '/reject',
      responder: function(api, resolve, reject) {
        reject({ error: 667 })
      }
    },
    {
      endpoint: '/gen',
      responder: function*() {
        let state = this

        return yield am({ gen: 98 })
      }
    },
    {
      // returns status code 500
      endpoint: '/throw',
      responder: function*() {
        let state = this
        throw { error: 67 }

        return yield am({ test: 98 })
      }
    },
    {
      endpoint: '/telegraph*',
      rproxy: function(api) {
        return {
          url: api.req.url.replace('/telegraph', ''),
          baseURL: 'http://www.telegraph.co.uk'
        }
      },
      transformResponse: function(data) {
        return data
          .replace(/http:\/\/www.telegraph.co.uk/g, '/telegraph')
          .replace(/=\"\//g, '="http://www.telegraph.co.uk/')
      }
    },
    {
      endpoint: '/bbc*',
      rproxy: function(api) {
        return {
          url: api.req.url.replace('/bbc', ''),
          baseURL: 'http://bbc.co.uk'
        }
      },
      transformResponse: function(data) {
        return data
          .replace(/http:\/\/www.bbc.co.uk/g, '/bbc')
          .replace(/https:\/\/www.bbc.co.uk/g, '/bbc')
          .replace(/\/iplayer\//g, '/bbc/iplayer/')
          .replace(/\/sport\//g, '/bbc/sport/')
      }
    },
    {
      // change method in reverse proxy using requestTransform
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
    },
    {
      endpoint: '/newsapi/sources',
      rproxy: {
        url: 'https://newsapi.org/v2/sources',
        params: { apiKey: 'c13f0b7040a0461397c250f1c94233d0' }
      },
      transformResponse: function*(data) {
        return yield data.sources
      }
    },
    {
      endpoint: '/newsapi/headlines',
      rproxy: {
        url: 'https://newsapi.org/v2/top-headlines',
        params: { apiKey: 'c13f0b7040a0461397c250f1c94233d0' }
      },
      transformResponse: function(data) {
        return data.articles
      }
    },
    {
      endpoint: '/newsapi/everything',
      rproxy: {
        url: 'https://newsapi.org/v2/everything',
        params: { apiKey: 'c13f0b7040a0461397c250f1c94233d0' }
      }
    },
    {
      endpoint: '/html',
      responder: function*() {
        let state = this
        return yield Promise.resolve(
          '<html><body style="font-family:sans-serif"><h1>html</h1></body></html>'
        )
      }
    },
    {
      endpoint: '/genparams/:field',
      responder: function*() {
        let state = this
        return yield {
          params: state.params,
          query: state.query
        }
      }
    },
    {
      endpoint: '/params/:field',
      responder: function*() {
        let state = this
        return yield {
          params: state.params,
          query: state.query
        }
      }
    }
  ]
}
