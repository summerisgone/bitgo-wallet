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
        return this.state.me.data && this.state.me.data.id;
    }
    render() {
        return (
            <div>
                {this.isAuthenticated() ? (
                    <div>
                        <h2>Current User!</h2>
                        <Logout />
                        <code>me: {JSON.stringify(this.state.me)}</code>
                        <h2>Wallets</h2>
                        <code>wallets: {JSON.stringify(this.state.wallets)}</code>
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

ReactDOM.render(<WalletList />, document.getElementById('app'));
