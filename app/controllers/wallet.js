import Ember from 'ember';

export default Ember.Controller.extend({
  bitgo: Ember.inject.service(),
  init() {
    this._super(...arguments);
    this.get('bitgo').status().catch(() => {
      this.transitionToRoute('login');
    });
  },
  actions: {
    openModal: function(name) {
      console.log('openModal controller');
      Ember.$('.ui.' + name + '.modal').modal('show');
    }
  }
});
