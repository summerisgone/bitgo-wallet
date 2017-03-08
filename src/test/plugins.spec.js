'use strict';
const rx = require('rxjs');
const plugins = require('../plugins');
const Connection = require('../connection');
const assert = require('assert');
const sinon = require('sinon');

class BitGoMock {
    authenticate(options, cb) {cb({}, null);}
    logout(obj, cb) {cb({}, null);}
    me(obj, cb) {cb({}, null);}
    session(obj, cb) {cb({}, null);}
    wallets(obj, cb) {cb({}, null);}
}

const TOKEN_KEY = 'token' ; //same as in plugin
class StorageMock {
    setItem(key, value) {
        this[key] = value;
    }
    getItem(key) {
        return this[key];
    }
}


describe('plugins', function() {
    it('exports list of plugins', () => {
        assert.ok(plugins.length);
    });
});

describe('sdk plugin', function() {
    let BitGo, connection, spy, subscriptions = [];
    beforeEach(function() {
        spy = sinon.spy();
        BitGo = class extends BitGoMock {
            constructor(options) {
                super(options);
                spy(options);
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
    let BitGo, connection, spy, authenticateSpy, meSpy, auth, subscriptions = [];
    beforeEach(function() {
        auth = false;
        spy = sinon.spy();
        authenticateSpy = sinon.spy();
        meSpy = sinon.spy();
        BitGo = class extends BitGoMock {
            constructor(options) {
                super(options);
                spy(options);
            }
            authenticate(obj, cb) {
                authenticateSpy.apply(authenticateSpy, arguments);
                if (obj.username && obj.password) {
                    auth = true;
                    cb(null, {access_token: '123123'});
                } else {
                    auth = false;
                    cb({status: 401}, null);
                }
            }
            me(obj, cb) {
                meSpy();
                if (auth) {
                    cb(null, {});
                } else {
                    cb({status: 401}, null);
                }
            }
        };
        const storage = new StorageMock();
        storage.setItem(TOKEN_KEY, 'foo');
        connection = new Connection({plugins, BitGo, storage});
    });
    afterEach(function() {
        subscriptions.forEach(s => s.unsubscribe());
    });

    it('should work without subscription on auth observable', done => {
        connection.plugins.auth.authenticate({
            user: 'user@email.com',
            password: 'password',
            otp: '123456'
        });
        setTimeout(() => {
            assert.ok(authenticateSpy.callCount > 0);
            done();
        }, 300);
    });

    it('can handle curerntUser error', done => {
        subscriptions.push(
            connection.plugins.me.subscribe(response => {
                assert(response);
                assert(response.error);
                assert.equal(response.error.status, 401);
                done();
            })
        );
    });

    it('can re-authorize currentUser if token expired', done => {
        const unauthorized = connection.plugins.me.filter(r => r.error && r.error.status === 401);
        subscriptions.push(
            connection.plugins.me
            .filter(v => v.error === false)
            .subscribe(() => {
                done();
            })
        );
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
            assert.equal(auth.error.status, 401);
            done();
        }));
        connection.plugins.auth.authenticate({username: 'user'});
    });

});

describe('token and storage', function() {
    let connection, storage, setTokenSpy, subscriptions = [];
    const TOKEN_KEY = 'token' ; //same as in plugin
    beforeEach(function() {
        setTokenSpy = sinon.spy();
        class Storage extends StorageMock {
            setItem(key, value) {
                super.setItem(key, value);
                setTokenSpy(value);
            }
        }
        storage = new Storage();
        class BitGo extends BitGoMock {
            logout(obj, cb) {
                cb(null, {});
            }
        }
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

    it('reset token on logout', done => {
        connection.plugins.auth.logout();
        setTimeout(() => {
            assert.ok(setTokenSpy.calledWith(''));
            done();
        });
    });
});

describe('do not request me without token', function() {
    let connection, storage, meSpy, subscriptions = [];
    beforeEach(function() {
        meSpy = sinon.spy();
        storage = new StorageMock();
        storage.setItem(TOKEN_KEY, '');
        class BitGo extends BitGoMock {
            me(obj, cb) {
                meSpy();
                cb(null, {});
            }
        }
        connection = new Connection({plugins, BitGo, storage});
    });
    afterEach(function() {
        subscriptions.forEach(s => s.unsubscribe());
    });

    it('do not request me without token', done => {
        subscriptions.push(connection.plugins.me.subscribe(() => {}));
        setTimeout(function() {
            assert.ok(meSpy.callCount == 0);
            done();
        });
    });
});

describe('rx publishReplay + refcount', function() {
    it('works', () => {
        const subj = new rx.Subject();
        assert.ok(subj.publishReplay);
        assert.ok(subj.publishReplay().refCount);
    });

    it('provides last value', done => {
        const source = new rx.Subject();
        const newSubj = source.publishReplay().refCount();
        newSubj.subscribe(() => {}); // connect to observable
        source.next(0);
        newSubj.subscribe(v => {
            assert(v === 0);
            done();
        });
    });

    it('works as multicast', done => {
        const source = new rx.Subject();
        const spy = sinon.spy();
        const replaySubj = source.map(v => {
            spy();
            return v;
        }).publishBehavior().refCount();
        replaySubj.subscribe(() => {});
        replaySubj.subscribe(() => {});
        replaySubj.subscribe(() => {});
        source.next('foo');
        setTimeout(() => {
            assert.equal(spy.callCount, 1);
            done();
        });
    });
});