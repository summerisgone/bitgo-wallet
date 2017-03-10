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
    const initialValue = conn.options.storage ? conn.options.storage.getItem(TOKEN_KEY) || '' : '';
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
    .map(t => {
        const sdk =  new conn.options.BitGo({accessToken: t});
        // Good idea to have Promise anyway when SDK throw error or returns cached value rather than promise
        ['authenticate', 'logout', 'me', 'session'].forEach(method => {
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

function APIWrapperHelper(conn, getPromise) {
    const sdk = conn.inject('sdk');
    const tokenFiltered = conn.inject('token').filter(t => t.length);
    const loadingSubject = new rx.BehaviorSubject(false);
    const result = rx.Observable
    .combineLatest(sdk, tokenFiltered)
    .do(() => {loadingSubject.next(true);})
    .switchMap(args => {
        const sdk = args[0];
        return catchPromise(getPromise(sdk).then(response => {
            return {data: response, error: false};
        }).catch(error => {
            _resetTokenOnUnauthrizedResponse(error, tokenFiltered);
            return {error: error, data: {}};
        }));
    })
    .do(() => {loadingSubject.next(false);})
    .scan((acc, curr) => {
        return Object.assign({}, acc, curr);
    }, {})
    .publishReplay().refCount();
    result.loading = loadingSubject;
    return result;
}

function session(connection) {
    return APIWrapperHelper(connection, sdk => sdk.session({}));
}

function me(connection) {
    return APIWrapperHelper(connection, sdk => sdk.me({}));
}

function wallets(connection) {
    return APIWrapperHelper(connection, sdk => {
        const wallets = sdk.wallets();
        return wallets.list({getbalances: true});
    });
}

function auth(conn) {
    const authActions = new rx.ReplaySubject();
    const loadingSubject = new rx.BehaviorSubject(false);
    const sdk = conn.inject('sdk');
    const token = conn.inject('token');

    const authObservable = rx.Observable.combineLatest(authActions, sdk)
    .do(() => {loadingSubject.next(true);})
    .switchMap(args => {
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
            return {action: {name: action.name}, error, data: {}};
        }));
    })
    .do(() => {loadingSubject.next(false);})
    .scan((acc, curr) => {
        return Object.assign({}, acc, curr);
    }, {})
    .publishReplay();

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
    authObservable.loading = loadingSubject;
    authObservable.connect(); // TODO: get rid of dummy subscription
    return authObservable;
}

function time() {
    return rx.Observable.interval(200).timestamp().map(ts => new Date(ts.timestamp));
}

module.exports = {token, sdk, auth, session, me, wallets, time};
