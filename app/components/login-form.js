import Ember from 'ember';

export default Ember.Component.extend({
  session: Ember.inject.service('session'),
  actions: {
    authenticate() {
      let {username, password, otp} = this.getProperties('username', 'password', 'otp');
      this.set('loading', true);
      this.get('session').authenticate('authenticator:bitgo', {username, password, otp})
        .catch(error => {
          this.set('errorMessage', error);
        })
        .finally(() => {
          this.set('loading', false);
        });
    }
  },
  didRender() {
    this.set('text', 'text!!!');
    Ember.$('.ui.form').form({fields: {
      username: 'empty',
      password: 'empty',
      otp: 'empty'
    }});
  }
});
