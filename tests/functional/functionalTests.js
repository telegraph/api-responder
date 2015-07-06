
(function(){ 

    var 
    root=this,   
    assert = require("assert"),
    request=require('request'),
    shell=require("shelljs");
    console.log(8, __dirname);
   shell.exec('node ../../server 5556 tests/test-api-config.js',{async:true});

    console.log(11,'in test');
   
    /*
    describe(promiseType + ' Functional tests - Promise methods', function() {
        describe('resolve() & .then()', function() {
            var promiseReturnedFromThen, promise = new Promise(function(resolve) {
                setTimeout(function() {
                    resolve({
                        hello: 'world'
                    });
                }, 100);
            });
            it('then() should receive resolved value', function(done) {
                promiseReturnedFromThen = promise.then(function(data) {
                    assert.equal('world', data.hello);
                    done();
                    return data.hello;


                });
            });
            it('A second then() should receive resolved value', function(done) {
                promise.then(function(data) {
                    assert.equal('world', data.hello);
                    done();

                });
            });
            it('then() should return new Promise', function(done) {
                assert.notEqual(promiseReturnedFromThen, promise);

                promiseReturnedFromThen.then(function(value) {

                    assert.equal('world', value);
                    done();
                });
            });
        });

        describe('reject() and .catch()', function(done) {
            var promiseReturnedFromCatch,
                rejectPromise = new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        reject(new Error('Too late'));
                    }, 150);
                }),
                rejectPromise1 = new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve({
                            test: 'resolved instead'
                        });
                    }, 150);
                });

            it('catch() should receive rejected value', function(done) {
                promiseReturnedFromCatch = rejectPromise.catch(function(err) {
                    assert.equal('Too late', err.message);
                    return err.message;
                });
                promiseReturnedFromCatch.then(
                    function(message) {
                        assert.equal('Too late', message);
                        done();
                    }
                );
            });


            it('A second catch() should receive rejected value', function(done) {
                rejectPromise.catch(function(err) {
                    assert.equal('Too late', err.message);
                    done();

                });
            });
            it('catch() should return new Promise', function(done) {
                assert.notEqual(promiseReturnedFromCatch, rejectPromise);

                promiseReturnedFromCatch.then(function(value) {
                    assert.equal('Too late', value);
                    done();
                });
            });
            it('catch() should return Promise which resolves to fulfillment value if original Promise resolves', function(done) {

                // rejectPromise1 resolves so catch is not called but the promise returns resolves
                var promiseReturnedFromCatch = rejectPromise1.catch(function(err) {
                    return err.message;

                });

                promiseReturnedFromCatch.then(function(value) {
                    assert.equal('resolved instead', value.test);
                    done();
                });
            });
        });




        describe('Promise.resolve() use cases', function() {
            var resolvedPromise,
                promise = new Promise(function(resolve) {
                    resolve({
                        hello: 'world'
                    });
                }),
                thenable = {
                    then: function(resolve) {
                        resolve({
                            type: 'thenable'
                        });
                    }
                };
            it('Promise.resolve(promise) returns promise', function(done) {
                resolvedPromise = Promise.resolve(promise);
                assert.strictEqual(resolvedPromise, promise);
                resolvedPromise.then(function(data) {
                    assert.strictEqual('world', data.hello);
                    done();
                });
            });

            it('Promise.resolve(thenable) returns Promise that follows thenable', function(done) {
                Promise.resolve(thenable)
                    .then(function(data) {
                        done();
                        assert.equal('thenable', data.type);
                    });
            });
            it('Promise.resolve(value) returns Promise that resolves to value', function(done) {
                var resolvedPromise = Promise.resolve({
                    type: 'Promise.resolve'
                });
                resolvedPromise.then(function(data) {
                    assert.equal('Promise.resolve', data.type);

                });
                resolvedPromise
                    .then(function(data) {
                        assert.equal('Promise.resolve', data.type);
                        done();
                    });
            });
        });
        describe('Promise.reject() ', function(done) {
            it('Promise.resolve(value) should return promise that rejects to value', function(done) {
                rejectedPromise = Promise.reject(new Error(34));
                rejectedPromise.catch(function(err) {

                    assert.equal(34, err.message);

                });
                rejectedPromise.catch(function(err) {
                    assert.equal(34, err.message);


                    done();
                });

            });

        });
        describe('Promise.race()', function() {
            var promiseSloww = new Promise(function(resolve) {
                    setTimeout(function() {
                        resolve({
                            type: 'slow'
                        });
                    }, 100);
                }),
                promiseFastt = new Promise(function(resolve) {
                    setTimeout(function() {
                        resolve({
                            type: 'fast'
                        });
                    }, 50);
                });
            it('.race() should resolve when first Promise resolves', function(done) {
                Promise.race([promiseFastt, promiseSloww]).then(function(data) {
                    assert.equal('fast', data.type);
                    done();
                });
            });
            var promiseSlow = new Promise(function(resolve, reject) {
                setTimeout(function() {
                    reject(new Error('slow'));
                }, 100);
            });
            var promiseFast = new Promise(function(resolve, reject) {
                setTimeout(function() {
                    reject(new Error('fast'));
                }, 50);
            });
            it('.race() should reject when first Promise rejects', function(done) {
                Promise.race([promiseFast, promiseSlow]).catch(function(err) {
                    assert.equal('fast', err.message);
                    done();
                });
            });
        });
        describe('Promise.all()', function() {
            var promiseSlo = new Promise(function(resolve) {
                    setTimeout(function() {
                        resolve({
                            type: 'slow'
                        });
                    }, 100);
                }),
                promiseFas = new Promise(function(resolve) {
                    setTimeout(function() {
                        resolve({
                            type: 'fast'
                        });
                    }, 50);
                });
            it('.all() should resolve when last Promise resolves with array of returned values', function(done) {
                start = new Date().getTime();
                Promise.all([promiseFas, promiseSlo]).then(function(data) {


                    assert.equal('slow', data[1].type);
                    assert.equal('fast', data[0].type);
                    done();

                });
            });
            var promiseSl = new Promise(function(resolve, reject) {
                setTimeout(function() {
                    reject(new Error('slow'));
                }, 100);
            });
            var promiseFa = new Promise(function(resolve, reject) {
                setTimeout(function() {
                    reject(new Error('fast'));
                }, 50);
            });
            it('.all() should reject when first Promise rejects', function(done) {

                Promise.all([promiseFa, promiseSl]).catch(function(err) {
                    assert.equal('fast', err.message);
                    done();
                    
                });

            });

        });

    });*/


})();
