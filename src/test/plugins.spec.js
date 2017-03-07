'use strict';
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
            authenticate(obj, cb) {
                cb(null, {authenticate: true, success: true});
            }
            session(obj, cb) {
                cb(null, {session: true, success: true});
            }
            wallets(obj, cb) {
                cb(null, {wallets: true, success: true});
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

    it('promisifies API', done => {
        subscriptions.push(connection.plugins.sdk.subscribe(sdk => {
            sdk.session({}).then(data => {
                assert.ok(data.session);
                done();
            });
        }));
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
    let BitGo, connection, spy, subscriptions = [], auth = false;
    beforeEach(function() {
        spy = sinon.spy();
        BitGo = class {
            constructor(options) {
                spy(options);
            }
            authenticate(obj, cb) {
                auth = true;
                cb(null, {status: 200, data: {access_token: '123123'}});
            }
            session(obj, cb) {
                if (auth) {
                    cb(null, {session: true});
                } else {
                    cb({status: 401}, null);
                }
            }
            wallets(obj, cb) {
                cb(null, {wallets: true, success: true});
            }
        };
        connection = new Connection({plugins, BitGo});
    });
    afterEach(function() {
        subscriptions.forEach(s => s.unsubscribe());
    });

    it('can handle session error', done => {
        subscriptions.push(
            connection.plugins.session.subscribe(response => {
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
            unauthorized.subscribe(()=> connection.plugins.auth.authenticate({username: 'admin@example.com'}))
        );
    });
});