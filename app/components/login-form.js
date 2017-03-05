import Ember from 'ember';

export default Ember.Component.extend({
  bitgo: Ember.inject.service(),
  currentUser: Ember.inject.service('current-user'),
  init() {
    this._super(...arguments);
    this.set('loading', true);
    this.get('bitgo').status().then(() => {
      this.get('router').transitionTo('wallet');
    }). finally(() => {
      this.set('loading', false);
    })
  },
  actions: {
    authenticate() {
      let {username, password, otp} = this.getProperties('username', 'password', 'otp');
      this.set('loading', true);
      this.get('bitgo').authenticate({username, password, otp}).then(() => {
        this.get('router').transitionTo('wallet');
      }).catch(error => {
        this.set('errorMessage', error);
      }). finally(() => {
        this.set('loading', false);
      });
    }
  },
  didRender() {
    Ember.$('.ui.form').form({
      fields: {
        username: 'empty',
        password: 'empty',
        otp: 'empty'
      }
    });
  }
});
