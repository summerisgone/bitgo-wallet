'use strict';
const React = require('react');
const reactSemantic = require('semantic-ui-react');
const {Modal} = reactSemantic;

View.propTypes = {
    handleSubmit: React.PropTypes.func,
    handleInputChange: React.PropTypes.func,
    handleOpen: React.PropTypes.func,
    handleClose: React.PropTypes.func,
    loading: React.PropTypes.bool,
    open: React.PropTypes.bool,
    error: React
        .PropTypes
        .shape({message: React.PropTypes.string})
};
function View(props) {
    return (
        <div className="ui tiny button app-sendmoney__button" onClick={props.handleOpen}>
            Send Money
            <Modal open={props.open} onClose={props.handleClose}>
                <Modal.Header>Send money</Modal.Header>
                <Modal.Content>
                    <Modal.Description>
                        <form className={`ui form ${props.error ? 'error' : ''}`}
                            onSubmit={props.handleSubmit} >
                            <div className="field">
                                <label>Address</label>
                                <input type="text" name="address" onChange={props.handleInputChange}/>
                            </div>
                            <div className="field">
                                <label>Amount</label>
                                <div className="ui right labeled input">
                                    <input type="text" name="amount" onChange={props.handleInputChange}/>
                                    <div className="ui basic label">BTC</div>
                                </div>
                                <span>Enter value in BTC</span>
                            </div>
                            <div className="field">
                                <label>Wallet passphrase</label>
                                <input type="password" name="password" onChange={props.handleInputChange}/>
                                <span>Passphrase will not be stored</span>
                            </div>
                            {props.error ? ( <div className="ui error message">{props.error.message}</div> ) : null}
                            <input className="ui button" type="submit" value="Send"/>
                        </form>
                        <div className={`ui dimmer ${props.loading ? 'active' : ''}`}>
                            <div className="ui loader"></div>
                        </div>
                    </Modal.Description>
                </Modal.Content>
            </Modal>
        </div>
    );
}
module.exports = View;