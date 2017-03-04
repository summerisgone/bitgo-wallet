import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    openModal: function(name) {
      console.log('openModal controller');
      $('.ui.' + name + '.modal').modal('show');
    }
  }
});
