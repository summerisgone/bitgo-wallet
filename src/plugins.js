'use strict';
const Promise = require('bluebird');
const rx = require('rxjs');

rx.Observable.catchPromise = function catchPromise(promise) {
    return rx.Observable.defer(() => {
        const subject = new rx.AsyncSubject();
        promise.then(value => {
            subject.next(value);
            subject.complete();
        }, value => {
            subject.next(value);
        });
        return subject;
    });
};

function token() {
    return new rx.BehaviorSubject('');
}

function sdk(conn) {
    const token = conn.inject('token');
    return token.distinct().map(t => {
        const sdk = new conn.options.BitGo({accessToken: t});
        ['session', 'authenticate', 'wallets'].forEach(method => {
            sdk[method] = Promise.promisify(sdk[method]);
        });
        return sdk;
    }).publishReplay().refCount();
}

function session(conn) {
    const sdk = conn.inject('sdk');
    return sdk.switchMap(sdk => {
        return rx.Observable.catchPromise(sdk.session({}).then(response => {
            return {session: response, error: null};
        }, error => {
            return {error};
        }));
    }).scan((acc, curr) => {
        return Object.assign({}, curr, acc);
    }, {}).publishReplay().refCount();
}

function auth(conn) {
    const loginSubject = new rx.BehaviorSubject();
    const sdk = conn.inject('sdk');
    let _sdkInstance;

    const plugin = rx.Observable.combineLatest(loginSubject, sdk).map((loginSubject, sdk) => {
        _sdkInstance = sdk;
        return loginSubject;
    }).scan((acc, curr) => {
        return Object.assign({}, curr, acc);
    }, {}).publishReplay().refCount();
    plugin.authenticate = (username, password, otp) => {
        _sdkInstance.authenticate({
            username,
            password,
            otp
        }, (err, data) => {
            loginSubject.next({error: err, auth: data, action: 'authenticate'});
        });
    };
    plugin.logout = () => {
        _sdkInstance.logout({}, err => {
            if (err) {
                loginSubject.next({error: err, action: 'logout'});
            } else {
                loginSubject.next({error: null, auth: null, action: 'logout'});
            }
        });
    };
    return plugin;
}

function wallets(conn) {
    // const walletSubject = new rx.BehaviorSubject([]);
    const loadingSubject = new rx.BehaviorSubject();
    const sdk = conn.inject('sdk');
    const session = conn.inject('session');
    const walletSubject = rx.Observable.combineLatest(session, sdk).switchMap(args => {
        const sdk = args[1];
        loadingSubject.next(true);
        return sdk.wallets({}). finally(() => {
            loadingSubject.next(false);
        });
    }).publishReplay().refCount();
    walletSubject.loading = loadingSubject;
    return walletSubject;
}

module.exports = [token, sdk, auth, session, wallets];
