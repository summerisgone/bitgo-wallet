'use strict';
const Promise = require('bluebird');
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
    const source = new rx.BehaviorSubject(initialValue);
    const subject = source.distinct();
    subject.next = value => {
        conn.options.storage && conn.options.storage.setItem(TOKEN_KEY, value);
        source.next(value);
    };
    return subject;
}

function sdk(conn) {
    const token = conn.inject('token');
    return token
    // need to debounce since token might be set in few places
    // .debounceTime(10) ??
    .map(t => {
        const sdk =  new conn.options.BitGo({accessToken: t});
        // Good idea to have Promise anyway when SDK throw error or returns cached value rather than promise
        ['wallets', 'authenticate', 'logout', 'me', 'session'].forEach(method => {
            sdk[method] = Promise.promisify(sdk[method]);
        });
        return sdk;
    }).publishReplay().refCount();
}

function _resetTokenOnUnauthrizedResponse(response, token) {
    if (response.status === 401) {
        token.next('');
    }
}

function session(conn) {
    const sdk = conn.inject('sdk');
    return sdk.switchMap(sdk => {
        return catchPromise(sdk.session({}).then(response => {
            return {data: response, error: false};
        }).catch(error => {
            return {error: error, data: {}};
        }));
    }).scan((acc, curr) => {
        return Object.assign({}, acc, curr);
    }, {}).publishReplay().refCount();
}

function me(conn) {
    const sdk = conn.inject('sdk');
    // run only when SDK initialized with token
    const tokenFiltered = conn.inject('token').filter(t => t.length);
    return rx.Observable
    .combineLatest(sdk, tokenFiltered)
    .switchMap(args => {
        const sdk = args[0];
        return catchPromise(sdk.me().then(response => {
            return {data: response, error: false};
        }).catch(error => {
            _resetTokenOnUnauthrizedResponse(error, tokenFiltered);
            return {error: error, data: {}};
        }));
    })
    .scan((acc, curr) => {
        return Object.assign({}, acc, curr);
    }, {})
    .publishReplay().refCount();
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
            if (action.method === 'logout') {
                token.next('');
            }
            return {action: {name: action.name}, data: response, error: false};
        }).catch(error => {
            _resetTokenOnUnauthrizedResponse(error, token);
            return {action, error, data: {}};
        }));
    }).scan((acc, curr) => {
        return Object.assign({}, acc, curr);
    }, {}).publishReplay();

    authObservable.authenticate = options => {
        authActions.next({
            method: 'authenticate',
            args: options
        });
    };
    authObservable.logout = () => {
        authActions.next({
            method: 'logout'
        });
    };
    authObservable.connect(); // TODO: get rid of dummy subscription
    return authObservable;
}

function wallets(conn) {
    // const walletSubject = new rx.BehaviorSubject([]);
    const loadingSubject = new rx.BehaviorSubject();
    const sdk = conn.inject('sdk');
    // const me = conn.inject('me');
    // const walletSubject = rx.Observable.combineLatest(me, sdk).switchMap(args => {
        // const sdk = args[1];
    const walletSubject = sdk.map(sdk => {
        loadingSubject.next(true);
        return sdk.wallets({}).finally(() => {
            loadingSubject.next(false);
        });
    }).publishReplay().refCount();
    walletSubject.loading = loadingSubject;
    return walletSubject;
}

module.exports = [token, sdk, auth, session, wallets, me];
