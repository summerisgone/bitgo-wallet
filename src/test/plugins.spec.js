'use strict';
const Promise = require('bluebird');
const plugins = require('../plugins');
const Connection = require('../connection');
const assert = require('assert');
const sinon = require('sinon');

describe('plugins', function() {
    it('exports list of plugins', () => {
        assert.ok(plugins.length);
    });
});

describe('sdk plugin', function() {
    let BitGo, connection, spy, subscriptions = [];
    beforeEach(function() {
        spy = sinon.spy();
        BitGo = class {
            constructor(options) {
                spy(options);
            }
            authenticate() {
                return Promise.resolve({authenticate: true, success: true});
            }
            session() {
                return Promise.resolve({session: true, success: true});
            }
            wallets() {
                return Promise.resolve({wallets: true, success: true});
            }
        };
        connection = new Connection({plugins, BitGo});
    });
    afterEach(function() {
        subscriptions.forEach(s => s.unsubscribe());
    });

    it('instantiates sdk', () => {
        subscriptions.push(connection.plugins.sdk.subscribe(sdk => sdk));
        assert.equal(spy.callCount, 1);
    });

    it('re-instantiate on token change', () => {
        subscriptions.push(connection.plugins.sdk.subscribe(() => {}));
        connection.plugins.token.next('1');
        connection.plugins.token.next('2');
        connection.plugins.token.next('3');
        assert.equal(spy.callCount, 4);
    });

    it('do not re-instantiate on same token', () => {
        subscriptions.push(connection.plugins.sdk.subscribe(() => {}));
        connection.plugins.token.next('');
        connection.plugins.token.next('');
        connection.plugins.token.next('1');
        assert.equal(spy.callCount, 2);
        assert(spy.calledWith({accessToken: '1'}));
    });
});

describe('authentication', function() {
    let BitGo, connection, spy, authenticateSpy, auth, subscriptions = [];
    beforeEach(function() {
        auth = false;
        spy = sinon.spy();
        authenticateSpy = sinon.spy();
        BitGo = class {
            constructor(options) {
                spy(options);
            }
            authenticate(obj) {
                authenticateSpy.apply(authenticateSpy, arguments);
                if (obj.username && obj.password) {
                    auth = true;
                    return Promise.resolve({access_token: '123123'});
                } else {
                    auth = false;
                    return Promise.reject({status: 401, error: 'unauthorized'});
                }
            }
            session() {
                if (auth) {
                    return Promise.resolve({session: true});
                } else {
                    return Promise.reject({status: 401});
                }
            }
            wallets() {
                return Promise.resolve({wallets: true, success: true});
            }
        };
        connection = new Connection({plugins, BitGo});
    });
    afterEach(function() {
        subscriptions.forEach(s => s.unsubscribe());
    });

    it('should work without subscription on auth observable', () => {
        connection.plugins.auth.authenticate({
            user: 'user@email.com',
            password: 'password',
            otp: '123456'
        });
        assert.ok(authenticateSpy.callCount > 0);
    });

    it('can handle session error', done => {
        subscriptions.push(
            connection.plugins.session.subscribe(response => {
                assert(response);
                assert(response.error);
                assert.equal(response.error.status, 401);
                done();
            })
        );
    });

    it('can re-authorize session', (done) => {
        const spy = sinon.spy();
        const unauthorized = connection.plugins.session.filter(s => s.error && s.error.status === 401);
        subscriptions.push(
            connection.plugins.session.subscribe(response => {
                spy(response);
                if (spy.callCount === 2) {
                    done();
                }
            })
        );
        subscriptions.push(connection.plugins.auth.subscribe(() => {}));
        subscriptions.push(
            unauthorized.subscribe(()=> connection.plugins.auth.authenticate({
                username: 'admin@example.com',
                password: 'password'
            }))
        );
    });

    it('show authentication error', done => {
        subscriptions.push(connection.plugins.auth.subscribe(auth => {
            assert.ok(auth.error);
            assert.ok(auth.error.error);
            done();
        }));
        connection.plugins.auth.authenticate({username: 'user'});
    });
});

describe('token and storage', function() {
    let connection, storage, subscriptions = [];
    const TOKEN_KEY = 'token' ; //same as in plugin
    beforeEach(function() {
        const Storage = class {
            setItem(key, value) {
                this[key] = value;
            }
            getItem(key) {
                return this[key];
            }
        };
        class BitGo {
            authenticate() {
                return new Promise();
            }
            session() {
                return new Promise();
            }
            wallets() {
                return new Promise();
            }
        }
        storage = new Storage();
        storage.setItem(TOKEN_KEY, 'foo');
        connection = new Connection({plugins, BitGo, storage});
    });
    afterEach(function() {
        subscriptions.forEach(s => s.unsubscribe());
    });

    it('saves token on changes', done => {
        connection.plugins.token.next('123');
        setTimeout(function() {
            assert.equal(storage.getItem(TOKEN_KEY), '123');
            done();
        });
    });

    it('restores token on start', done => {
        connection.plugins.token.subscribe(t => {
            assert.equal(t, 'foo');
            done();
        });
    });
});