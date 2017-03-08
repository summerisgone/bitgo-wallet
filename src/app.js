'use strict';
const React = require('react');
const ReactDOM = require('react-dom');
const bindAll = require('lodash.bindall');
const plugins = require('./plugins');
const Connection = require('./connection');
const BitGo = require('../vendor/BitGoJS');
const storage = require('./storage');
const toast = require('react-notify-toast');
const Notifications = toast.default;
const notify = toast.notify;

require('semantic-ui-css/semantic.css');
require('./app.css');

const Frontpage = require('./views/frontpage.jsx');
const Login = require('./views/login.jsx');
const Wallets = require('./views/wallet-list.jsx');
const Wallet = require('./views/wallet.jsx');
const SendMoney = require('./views/send-money.jsx');
const Unlock = require('./views/unlock.jsx');

const connection = new Connection({plugins: plugins, BitGo: BitGo.BitGo, storage: storage});


class BaseComponent extends React.Component {
    constructor(props) {
        super(props);
        this._subscriptions = [];
    }
    componentWillUnmount() {
        this._subscriptions.forEach(s => s.unsubscribe());
    }
    subscribeState(observable, key) {
        this._subscriptions.push(observable.subscribe(data => {
            this.setState({[key]: data});
        }));
    }
}

class SendMoneyComponent extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            result: null,
            error: null
        };
        bindAll(this, ['handleSubmit', 'handleInputChange']);
    }
    handleSubmit(e) {
        e.preventDefault();
        this.setState({loading: true});
        this.sdk.wallets().get({id: this.props.wallet.id})
        .then(wallet => {
            try {
                wallet.sendCoins({
                    address: this.state.address,
                    amount: parseFloat(this.state.amount) * 10e8,
                    walletPassphrase: this.state.password
                }).then(result => {
                    this.setState({result});
                    notify.show('Transaction sent', 'success');
                }).catch(error => {
                    this.setState({error});
                    notify.show('Transation error', 'error');
                }).finally(() => {
                    this.setState({loading: false});
                });
            } catch (error) {
                notify.show(error.message, 'error');
                this.setState({loading: false, error});
            }
        });
    }
    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        this.setState({[name]: value});
    }
    componentDidMount() {
        this._subscriptions.push(
            connection.plugins.sdk.subscribe(sdk => this.sdk = sdk)
        );
    }
    render() {
        return (
            <SendMoney error={this.state.error ? {message: this.state.error.message} : null}
                loading={this.state.loading}
                open={this.state.showForm}
                handleOpen={() => this.setState({showForm: true})}
                handleClose={() => this.setState({showForm: false})}
                handleInputChange={this.handleInputChange}
                handleSubmit={this.handleSubmit} />
        );
    }
}

class WalletList extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            wallets: {data: {wallets: []}}
        };
    }
    componentDidMount() {
        this.subscribeState(connection.plugins.wallets, 'wallets');
    }
    render() {
        return (<Wallets wallets={this.state.wallets.data.wallets}>
            <div>
                {this.state.wallets.data.wallets.map(w => {
                    const sendMoney = <SendMoneyComponent wallet={w.wallet} />;
                    return <Wallet key={w.wallet.id} wallet={w} sendMoney={sendMoney} />;
                })}
            </div>
        </Wallets>);
    }
}

class Logout extends BaseComponent {
    constructor() {
        super();
        bindAll(this, ['handleClick']);
    }
    handleClick(e) {
        e.preventDefault();
        connection.plugins.auth.logout();
    }
    render() {
        return (
            <button className="ui submit button" onClick={this.handleClick}>Log out</button>
        );
    }
}

class LoginComponent extends BaseComponent {
    constructor() {
        super();
        this.state = {auth: {}};
        bindAll(this, ['handleSubmit', 'handleInputChange']);
    }
    componentDidMount() {
        this.subscribeState(connection.plugins.auth, 'auth');
        this.subscribeState(connection.plugins.auth.loading, 'loading');
    }
    handleSubmit(e) {
        e.preventDefault();
        connection.plugins.auth.authenticate({
            username: this.state.username,
            password: this.state.password,
            otp: this.state.otp
        });
    }
    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        this.setState({[name]: value});
    }
    render() {
        return (
            <Login loading={this.state.loading}
                error={this.state.auth.error ? {message: this.state.auth.error.message} : null}
                handleInputChange={this.handleInputChange}
                handleSubmit={this.handleSubmit} />
        );
    }
}

class UnlockComponent extends BaseComponent {
    constructor() {
        super();
        this.state = {locked: true, showForm: false};
        bindAll(this, ['handleSubmit', 'handleInputChange']);
    }
    componentDidMount() {
        this._subscriptions.push(
            connection.plugins.sdk.subscribe(sdk => this.sdk = sdk)
        );
        this._subscriptions.push(
            connection.plugins.time.subscribe(now => {
                const expires = this.state.expires;
                this.setState({
                    timeLeft: Math.floor((expires - now) / 1000)
                });
            })
        );
        this.subscribeState(connection.plugins.time, 'time');
    }
    handleSubmit(e) {
        e.preventDefault();
        const duration = 600;
        this.setState({showForm: true, error: null});
        this.sdk.unlock({otp: this.state.otp, duration})
        .then(() => {
            const expires = new Date();
            expires.setSeconds(expires.getSeconds() + duration);
            this.setState({locked: false, showForm: false, expires});
            // Display an info toast with no title
            notify.show('Session unlocked', 'success');
        })
        .catch(error => {
            this.setState({error: {message: error.message}, otp: ''});
        });
    }
    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        this.setState({[name]: value});
    }
    render() {
        return (<Unlock handleSubmit={this.handleSubmit}
            handleInputChange={this.handleInputChange}
            handleOpen={() => this.setState({showForm: true})}
            handleClose={() => this.setState({showForm: false})}
            error={this.state.error}
            open={this.state.showForm}
            otp={this.state.otp}
            timeLeft={this.state.timeLeft} />
        );
    }
}

class App extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            me: {}
        };
        bindAll(this, ['isAuthenticated']);
    }
    componentDidMount() {
        this.subscribeState(connection.plugins.me, 'me');
        this.subscribeState(connection.plugins.me.loading, 'loading');
    }
    isAuthenticated() {
        return this.state.me.data && this.state.me.data.id && this.state.me.data.id.length > 0;
    }
    render() {
        return (
            <div className="app">
                <Notifications />
                {this.isAuthenticated() ? (
                    <Frontpage username={this.state.me.data.username}
                        signOut={<Logout />}
                        unlock={<UnlockComponent />}
                        walletList={<WalletList />} />
                ) : <LoginComponent />}
                <div className={`ui dimmer ${this.state.loading ? 'active' : ''}`}>
                    <div className="ui loader"></div>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('app'));
