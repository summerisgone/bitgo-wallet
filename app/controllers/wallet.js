import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    openModal: function(name) {
      debugger;
      $('.ui.' + name + '.modal').modal('show');
    }
  }
});
