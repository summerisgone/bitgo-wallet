import Base from 'ember-simple-auth/authenticators/base';
import Ember from 'ember';

export default Base.extend({
  bitgo: Ember.inject.service(),
  restore(data) {
  },

  authenticate(options) {
    return new Ember.RSVP.Promise((resolve, reject) => {
      this.get('bitgo').client.authenticate(options, (err, data) => {
        if (err) {
          reject((err.result && err.result.error_description) || err);
        } else {
          resolve(data);
        }
      })
    });
  },
  invalidate(data) {
  }
});
