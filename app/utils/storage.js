import Ember from 'ember';

// just proxy
export default Ember.Object.extend({
  setItem: function (value) {
    return localStorage.setItem(value);
  },
  getItem: function (value) {
    return localStorage.getItem(value);
  }
});
