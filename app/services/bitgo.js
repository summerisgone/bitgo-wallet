import Ember from 'ember';
import BitGo from 'bitgo';

export default Ember.Service.extend({
  init() {
    this._super(...arguments);
    this.setupSDK(localStorage.getItem('token'));
  },
  setupSDK(token) {
    const options = {};
    if (token) {
      options.accessToken = token;
    }
    this.set('_client', new BitGo.BitGo(options));
  },
  status() {
    console.log(`session: ${this.get('session')}`)
    // cache
    if (this.get('_cachedSession')) {
      return new Ember.RSVP.Promise((resolve, reject) => {
        resolve(this.get('_cachedSession'));
      });
    } else {
      return new Ember.RSVP.Promise((resolve, reject) => {
        this.get('_client').session({}, (err, data) => {
          console.log(`session response: ${err}, ${data}`);
          if (err) {
            if (err.status === 401) {
              localStorage.setItem('token', '');
              this.setupSDK();
            }
            reject(err);
          } else {
            this.set('_cachedSession', data);
            resolve(data);
          }
        });
      });
    }
  },
  authenticate(options) {
    return new Ember.RSVP.Promise((resolve, reject) => {
      this.get('_client').authenticate(options, (err, data) => {
        if (err) {
          reject((err.result && err.result.error_description) || err);
        } else {
          localStorage.setItem('token', data.access_token);
          resolve(data);
        }
      });
    });
  },
  invalidate(data) {
    return new Ember.RSVP.Promise((resolve, reject) => {
      this.get('_client').logout({}, err => {
        if (err) {
          reject(err);
        } else {
          localStorage.setItem('token', '');
          resolve();
        }
      })
    });
  }
});
