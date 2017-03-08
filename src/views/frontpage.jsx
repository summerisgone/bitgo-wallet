const React = require('react');

View.propTypes = {
    username: React.PropTypes.string,
    signOut: React.PropTypes.element,
    sendMoney: React.PropTypes.element,
    unlock: React.PropTypes.element,
    walletList: React.PropTypes.element
};
function View(props) {
    return (
        <div className="app-frontpage">
            <div className="ui inverted teal vertical segment">
                <div className="ui inverted teal menu">
                    <div className="ui container">
                        <a className="header item">
                            <img className="app-header__logo logo"
                                src={require('../assets/logo.svg')}
                                alt="Bitcoin Logo"/>
                            My Wallet
                        </a>
                        <div className="item right">
                            <div className="item">Signed in as {props.username}</div>
                            <div className="item">{props.unlock}</div>
                            <div className="item">{props.signOut}</div>
                        </div>
                    </div>
                </div>
            </div>
            {props.walletList}
        </div>
    );
}
module.exports = View;