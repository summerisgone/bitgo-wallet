'use strict';
import React from 'react';
import ReactDOM from 'react-dom';
import {Route, Router, hashHistory} from 'react-router';
import plugins from './plugins';
import Connection from './connection';
import BitGo from '../vendor/BitGoJS';

const connection = new Connection({plugins: plugins, BitGo: BitGo.BitGo});

class BaseComponent extends React.Component {
    constructor(props) {
        super(props);
        this._subscriptions = [];
    }
    componentWillUnmount() {
        this._subscriptions.forEach(s => s.unsubscribe());
    }
}

class WalletList extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            wallets: []
        };
    }
    componentDidMount() {
        this._subscriptions.push(connection.plugins.wallets.subscribe(wallets => {
            this.setState({wallets});
        }));
        this._subscriptions.push(connection.plugins.session.subscribe(session => {
            if (session.error && session.error.status === 401) {
                hashHistory.push('/login');
            }
            this.setState({session});
        }));
    }
    render() {
        return (
            <div>
                <h2>Session</h2>
                <code>{JSON.stringify(this.state.session)}</code>
                <h2>Wallets</h2>
                <code>{JSON.stringify(this.state.wallets)}</code>
            </div>
        );
    }
}

class LoginForm extends BaseComponent {
    constructor() {
        super();
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
    }
    handleSubmit(e) {
        e.preventDefault();
        connection.plugins.auth.authenticate({username: this.state.username, password: this.state.password, otp: this.state.otp});
        
    }
    componentDidMount() {
        this._subscriptions.push(connection.plugins.auth.subscribe(auth => {
            this.setState({auth});
            if (auth) {
                hashHistory.push('/');
            }
        }));
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

ReactDOM.render(
    <Router history={hashHistory}>
        <Route path="/" component={WalletList}/>
        <Route path="/login" component={LoginForm}/>
    </Router>, document.getElementById('app'));
