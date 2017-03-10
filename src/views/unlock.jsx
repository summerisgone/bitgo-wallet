'use strict';
const React = require('react');
const reactSemantic = require('semantic-ui-react');
const {Modal} = reactSemantic;


View.propTypes = {
    handleSubmit: React.PropTypes.func,
    handleInputChange: React.PropTypes.func,
    handleOpen: React.PropTypes.func,
    handleClose: React.PropTypes.func,
    open: React.PropTypes.bool,
    loading: React.PropTypes.bool,
    timeLeft: React.PropTypes.number,
    otp: React.PropTypes.string,
    error: React
        .PropTypes
        .shape({message: React.PropTypes.string})
};
function View(props) {
    const button = (<buton className="ui button" onClick={props.handleOpen}>
        {props.timeLeft > 0
            ? <div><i className="icon unlock"></i> {props.timeLeft}s</div>
            : <div><i className="icon lock" title="Locked!"></i>Locked</div>}
    </buton>);
    return (
        <div>
            {button}
            <Modal open={props.open} onClose={props.handleClose}>
                <Modal.Header>Unlock session</Modal.Header>
                <Modal.Content>
                <Modal.Description>
                    <form className={`ui form ${props.error ? 'error' : ''}`}
                        onSubmit={props.handleSubmit} >
                        <div className="field">
                            <label>OTP</label>
                            <input type="text"
                                name="otp"
                                onChange={props.handleInputChange}/>
                        </div>
                        {props.error ? ( <div className="ui error message">{props.error.message}</div> ) : null}
                        <input className="ui button" type="submit" value="Unlock"/>
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