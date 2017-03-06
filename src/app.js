import React from 'react';
import ReactDOM from 'react-dom';
import connection from './connection';

class WalletList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            wallets: []
        };
    }
    componentDidMount() {
        this._wallets = connection.wallets.subscribe(wallets => {
            this.setState({wallets});
        });
    }
    componentWillUnmount() {
        this._wallets.dispose();
    }
    render() {
        return <div>{this.state.wallets}</div>;
    }
}

ReactDOM.render(
    <div>
    <h1>App!</h1>
    <WalletList></WalletList>
</div>, document.getElementById('app'));