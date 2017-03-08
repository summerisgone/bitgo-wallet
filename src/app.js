'use strict';
const React = require('react');
const ReactDOM = require('react-dom');
const bindAll = require('lodash.bindall');
const plugins = require('./plugins');
const Connection = require('./connection');
const BitGo = require('../vendor/BitGoJS');
const storage = require('./storage');

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

class SendMoney extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            result: null,
            error: null
        };
        bindAll(this, ['clickHandler']);
    }
    clickHandler(e) {
        e.preventDefault();
        this.setState({loading: true});
        this.sdk.wallets().get({id: this.props.wallet.wallet.id})
        .then(wallet => {
            wallet.sendCoins({
                address: '2NApDVj2N46fW6h1XF3J3xdtaJ5ooKEbwpj',
                amount:  0.0001 * 1e8,
                walletPassphrase: '*top secret*'
            }).then(result => {
                this.setState({result});
            }).catch(error => {
                this.setState({error});
            }).finally(() => {
                this.setState({loading: false});
            });
        });
    }
    componentDidMount() {
        this._subscriptions.push(
            connection.plugins.sdk.subscribe(sdk => this.sdk = sdk)
        );
    }
    render() {
        return (<div>
            <code>loading: {this.state.loading}</code>
            <code>result: {JSON.stringify(this.state.result)}</code>
            <code>error: {JSON.stringify(this.state.error)}</code>
            <button onClick={this.clickHandler}>Send!</button>
        </div>);
    }
}

class WalletList extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            wallets: {},
            me: {}
        };
        bindAll(this, ['isAuthenticated']);
    }
    componentDidMount() {
        this.subscribeState(connection.plugins.wallets, 'wallets');
        this.subscribeState(connection.plugins.me, 'me');
    }
    isAuthenticated() {
        return this.state.me.data && this.state.me.data.id.length > 0;
    }
    render() {
        return (
            <div>
                <span>{this.isAuthenticated()}</span>
                {this.isAuthenticated() ? (
                    <div>
                        <h2>Current User!</h2>
                        <Logout />
                        <code>me: {JSON.stringify(this.state.me)}</code>
                        <h2>Wallets</h2>
                        <code>wallets: {JSON.stringify(this.state.wallets)}</code>
                        <UnlockForm />
                        {this.state.wallets ? this.state.wallets.data.wallets.map(Wallet => {
                            return (<div key={Wallet.wallet.id}>
                                <strong>{Wallet.wallet.label}</strong>
                                <SendMoney wallet={Wallet} />
                            </div>);
                        }) : null}
                    </div>
                ) : <div>
                    <h2>Please login</h2>
                    <code>me: {JSON.stringify(this.state.me)}</code>
                    <LoginForm />

                </div>}
            </div>
        );
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
            <button onClick={this.handleClick}>Log out</button>
        );
    }
}

class LoginForm extends BaseComponent {
    constructor() {
        super();
        this.state = {auth: {}};
        bindAll(this, ['handleSubmit', 'handleInputChange']);
    }
    componentDidMount() {
        this.subscribeState(connection.plugins.auth, 'auth');
    }
    handleSubmit(e) {
        e.preventDefault();
        connection.plugins.auth.authenticate({username: this.state.username, password: this.state.password, otp: this.state.otp});
    }
    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        this.setState({[name]: value});
    }
    render() {
        return (
            <div>
                <code>auth: {JSON.stringify(this.state.auth)}</code>
                <br/>
                <form onSubmit={this.handleSubmit}>
                    <label>Username
                        <input type="text" name="username" onChange={this.handleInputChange}/>
                    </label>
                    <label>Password
                        <input type="password" name="password"  onChange={this.handleInputChange}/>
                    </label>
                    <label>OTP
                        <input type="text" name="otp"  onChange={this.handleInputChange}/>
                    </label>
                    <input type="submit" value="Submit"/>
                </form>
            </div>
        );
    }
}


class UnlockForm extends BaseComponent {
    constructor() {
        super();
        this.state = {locked: true};
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
        this.sdk.unlock({otp: this.state.otp, duration})
        .then(() => {
            const expires = new Date();
            expires.setSeconds(expires.getSeconds() + duration);
            this.setState({locked: false, expires});
            setTimeout(() => {
                this.setState({locked: true});
            });
        })
        .catch(error => {
            this.setState({error, otp: ''});
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
            <form onSubmit={this.handleSubmit}>
                {this.state.timeLeft > 0 ? <div>{this.state.timeLeft}s</div> : <div>Locked!</div>}
                <label>OTP
                    <input type="text" name="otp" value={this.state.otp} onChange={this.handleInputChange}/>
                </label>
                <input type="submit" value="Unlock"/>
            </form>
        );
    }
}

ReactDOM.render(<WalletList />, document.getElementById('app'));
