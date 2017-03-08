'use strict';
const rx = require('rxjs');

function catchPromise (promise) {
    return rx.Observable.defer(() => {
        const subject = new rx.AsyncSubject();
        promise.then(value => {
            subject.next(value);
            subject.complete();
        }).catch(error => {
            subject.next(error);
        });
        return subject;
    });
}

function token(conn) {
    const TOKEN_KEY = 'token' ;
    const initialValue = conn.options.storage ? conn.options.storage.getItem(TOKEN_KEY) : '';
    const subj = new rx.BehaviorSubject(initialValue);
    subj.old_next = subj.next;
    subj.next = value => {
        conn.options.storage && conn.options.storage.setItem(TOKEN_KEY, value);
        subj.old_next(value);
    };
    return subj;
}

function sdk(conn) {
    const token = conn.inject('token');
    return token.distinct().map(t => {
        return new conn.options.BitGo({accessToken: t});
    }).publishReplay().refCount();
}

function session(conn) {
    const sdk = conn.inject('sdk');
    return sdk.switchMap(sdk => {
        return catchPromise(sdk.session({}).then(response => {
            return {session: response, error: null};
        }).catch(error => {
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
        return catchPromise(_sdkInstance[action.method](action.args).then((response) => {
            if (action.method === 'authenticate') {
                if (response.access_token) {
                    token.next(response.access_token);
                }
            }
            return {action: action, auth: response, error: null};
        }).catch(error => {
            return {action, error};
        }));
    }).scan((acc, curr) => {
        return Object.assign({}, acc, curr);
    }, {}).publishReplay().refCount();

    authObservable.authenticate = options => {
        authActions.next({
            method: 'authenticate',
            args: options
        });
    };
    authObservable.subscribe(() => {}); // TODO: get rid of dummy subscription
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
