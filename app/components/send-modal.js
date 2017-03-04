// import Ember from 'ember';
//
// export default Ember.Component.extend({
// });
//
import UiModal from 'semantic-ui-ember/components/ui-modal';

export default UiModal.extend({
  name: 'send-modal',
  classNames: ['send-modal'],

  actions: {
    yes: function() {
      alert('yes');
      this.execute('hide');
    },

    no: function() {
      alert('no');
    }
  }
});