'use strict';
const React = require('react');

View.propTypes = {
    handleInputChange: React.PropTypes.func,
    handleSubmit: React.PropTypes.func,
    loading: React.PropTypes.bool,
    error: React
        .PropTypes
        .shape({message: React.PropTypes.string})
};
function View(props) {
    return (
        <div className="ui middle aligned center aligned grid app-login">
            <div className="six wide column">
                <h2 className="ui header">
                    Login to your account!
                </h2>
                <div className="ui teal segment left aligned">
                    <form
                        className={`ui form ${props.error ? 'error' : ''}`}
                        onSubmit={props.handleSubmit}>
                        <div className="field">
                            <label>Username</label>
                            <input type="text" name="username" onChange={props.handleInputChange}/>
                        </div>
                        <div className="field">
                            <label>Password</label>
                            <input type="password" name="password" onChange={props.handleInputChange}/>
                        </div>
                        <div className="field">
                            <label>OTP Password</label>
                            <input type="text" name="otp" onChange={props.handleInputChange}/>
                        </div>
                        {props.error ? ( <div className="ui error message">{props.error.message}</div> ) : null}
                        <button type="submit" className="ui submit button">Login</button>
                    </form>
                    <div className={`ui dimmer ${props.loading ? 'loading' : ''}`}>
                        <div className="ui loader"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
module.exports = View;