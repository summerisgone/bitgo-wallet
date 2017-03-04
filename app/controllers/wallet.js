import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    openModal: function(name) {
      console.log('openModal controller');
      Ember.$('.ui.' + name + '.modal').modal('show');
    }
  }
});
