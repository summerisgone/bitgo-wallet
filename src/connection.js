import Connection from 'observable-connection';
import Promise from 'bluebird';
import BitGo from '../vendor/BitGoJS';
import rx from 'rxjs';

function token() {
    return rx.BehaviorSubject('');
}

function sdk(conn) {
    const token = conn.inject('token');
    return token.map(t => new BitGo({accessToken: t})).shareReplay(1);
}

function session(conn) {
    const sessionSubject = new rx.BehaviorSubject();
    const sdk = conn.inject('sdk');
    return sdk.flatMapLatest(sdk => {
        const session = Promise.promisify(sdk.session);
        return session({})
    })
        .scan((acc, cur) => {
            return Object.assign({}, curr, acc);
        }, {})
        .shareReplay(1);
}

function auth(conn) {
    const loginSubject = new rx.BehaviorSubject();
    const sdk = conn.inject('sdk');
    const token = conn.inject('token');
    let _sdkInstance;

    const plugin = rx.Observable.combineLatest(loginSubject, sdk)
    .map((loginSubject, sdk) => {
        _sdkInstance = sdk;
        return loginSubject;
    })
    .scan((acc, cur) => {
        return Object.assign({}, curr, acc);
    }, {})
    .shareReplay(1);
    plugin.authenticate = (username, password, otp) => {
        _sdkInstance.authenticate({username, password, otp}, (err, data) => {
            loginSubject.next({error: err, auth: data, action: 'authenticate'});
        });
    }
    plugin.logout = () => {
        _sdkInstance.logout({}, err => {
            if (err) {
                loginSubject.next({error: err, action: 'logout'});
            } else {
                loginSubject.next({error: null, auth: null, action: 'logout'});
            }
        })
    }
    return plugin;
}

function wallets(conn) {
    // const walletSubject = new rx.BehaviorSubject([]);
    const loadingSubject = new rx.BehaviorSubject();
    const sdk = conn.inject('sdk');
    const session = conn.inject('session');
    const walletSubject = rx.Observable
        .combineLatest(session, sdk)
        .flatMapLatest(([session, sdk]) => {
            const wallets = Promise.promisify(sdk.wallets);
            loadingSubject.next(true);
            return wallets({}).always(() => {
                loadingSubject.next(false);
            });
        })
        .shareReplay(1);
    walletSubject.loading = loadingSubject;
    return walletSubject;
}

const connection = new Connection({plugins: [
    token,
    sdk,
    auth,
    session,
    wallets
]});

export default connection;