'use strict';
const React = require('react');

View.propTypes = {
    children: React.PropTypes.element.isRequired,
    wallets: React.PropTypes.array
};
function View(props) {
    const total = props.wallets
        .map(w => w.wallet.balance)
        .reduce((acc, curr) => {return acc + curr;}, 0);
    return (
        <div>
            <div className="ui header segment">
                <div className="ui text container">
                    <h1 className="ui header">Wallets</h1>
                    <span className="ui sub header">Total {Math.round(total / 10e3) / 10e4}BTC</span>
                </div>
            </div>
            {props.children}
        </div>
    );
}
module.exports = View;