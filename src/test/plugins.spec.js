'use strict';
const plugins = require('../plugins');
const Connection = require('../connection');
const assert = require('assert');
const sinon = require('sinon');
const Promise = require('bluebird');

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
