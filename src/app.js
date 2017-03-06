'use strict';
import React from 'react'
import ReactDOM from 'react-dom'
import plugins from './plugins'
import Connection from './connection'
import {BitGo} from '../vendor/BitGoJS';

const connection = new Connection({plugins, BitGo})

class BaseComponent extends React.Component {
    constructor(props) {
        super(props)
        this._subscriptions = []
    }
    componentWillUnmount() {
        this._subscriptions.forEach(s => s.unsubscribe())
    }
}

class WalletList extends BaseComponent {
    constructor(props) {
        super(props)
        this.state = {
            wallets: []
        }
    }
    componentDidMount() {
        this._subscriptions.push(connection.plugins.wallets.subscribe(wallets => {
            this.setState({wallets})
        }))
        this._subscriptions.push(connection.plugins.session.subscribe(session => {
            this.setState({session})
        }))
    }
    render() {
        return (
            <div>
                <h2>Session</h2>
                <code>{JSON.stringify(this.state.session)}</code>
                <h2>Wallets</h2>
                <code>{JSON.stringify(this.state.wallets)}</code>
            </div>
        )
    }
}

ReactDOM.render(
    <div>
    <h1>App!</h1>
    <WalletList></WalletList>
</div>, document.getElementById('app'))
