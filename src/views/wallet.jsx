'use strict';
const React = require('react');

View.propTypes = {
    children: React.PropTypes.element,
    sendMoney: React.PropTypes.element,
    wallet: React.PropTypes.object
};
function View(props) {
    return (
        <div className="ui vertical segment">
            <div className="ui text container">
                <div className="ui two column grid">
                    <div className="column">
                        <h1 className="ui header">
                            {props.wallet.wallet.label}
                            <span className="sub header">
                                {props.wallet.wallet.id}
                            </span>
                        </h1>
                    </div>
                    <div className="column">
                        <div className="ui header right aligned">
                            {Math.round(props.wallet.wallet.balance / 10e3) / 10e4}
                            &nbsp;BTC
                        </div>
                        {props.wallet.wallet.balance > 0 ? props.sendMoney : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
module.exports = View;