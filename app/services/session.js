import Ember from 'ember';
import BitGo from '../utils/bitgo';
import storage from '../utils/storage';

export default Ember.Service.extend({
  init() {
    this._super(...arguments);
    if (!this.get('_bitgo')) {
      this.set('_bitgo', this.setupSDK(storage.getItem('token')));
    }
  },
  setupSDK(token) {
    const options = {};
    if (token) {
      options.accessToken = token;
    }
    return new BitGo(options);
  },
  status() {
    // cache
    if (this.get('_cachedSession')) {
      return new Ember.RSVP.Promise((resolve) => {
        resolve(this.get('_cachedSession'));
      });
    } else {
      const bitgo = this.get('_bitgo');
      return bitgo.session({}).then(data => {
        this.set('_cachedSession', data);
        return data;
      }).catch(err => {
        if (err.status === 401) {
          storage.setItem('token', null);
          this.set('_bitgo', this.setupSDK());
        }
        return err;
      })
    }
  },
  authenticate(options) {
    const bitgo = this.get('_bitgo');
    return bitgo.authenticate(options).then(data => {
      storage.setItem('token', data.access_token);
    });
  },
  invalidate() {
    const bitgo = this.get('_bitgo');
    return bitgo.logout({}).then(() => {
      storage.setItem('token', null);
    });
  }
});
