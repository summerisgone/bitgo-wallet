'use strict';
const Promise = require('bluebird');
const rx = require('rxjs');

function catchPromise (promise) {
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
}

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
        return catchPromise(sdk.session({}).then(response => {
            return {session: response, error: null};
        }, error => {
            return {error};
        }));
    }).scan((acc, curr) => {
        return Object.assign({}, acc, curr);
    }, {}).publishReplay().refCount();
}

function auth(conn) {
    const authActions = new rx.ReplaySubject();
    const sdk = conn.inject('sdk');
    const token = conn.inject('token');

    const authObservable = rx.Observable.combineLatest(authActions, sdk).switchMap(args => {
        const action = args[0],
            _sdkInstance = args[1];
        return catchPromise(_sdkInstance[action.method](action.arguments).then((response) => {
            if (action.method === 'authenticate') {
                if (response.status === 200) {
                    token.next(response.data.access_token);
                }
            }
            return {action, response};
        }));
    }).scan((acc, curr) => {
        return Object.assign({}, acc, curr);
    }, {}).publishReplay().refCount();

    authObservable.authenticate = (username, password, otp) => {
        authActions.next({
            method: 'authenticate',
            arguments: {username, password, otp}
        });
    };
    return authObservable;
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
