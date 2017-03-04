import Ember from 'ember';
import BitGo from 'npm:bitgo';

export default Ember.Controller.extend({
  actions: {
    authenticate() {
      const bitgo = new BitGo.BitGo();
      let {username, password, otp} = this.getProperties('username', 'password', 'otp');
      bitgo.authenticate({username, password, otp}, (err, response) => {
        console.log(err, response);
      });
      console.log(bitgo);
    }
  }
});
