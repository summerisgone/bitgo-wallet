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
                <div className="ui text container">
                    <div className="ui inverted teal menu">
                        <a className="header item">
                            <img className="app-header__logo logo"
                                src={require('../assets/logo.svg')}
                                alt="Bitcoin Logo"/>
                            {props.username}
                        </a>
                        <div className="right menu">
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