import BitGo from 'bitgo';
import Ember from 'ember';

export default Ember.object.extend({
  init(token) {
    const options = {};
    if (token) {
      options.accessToken = token;
    }
    this.set('_client', new BitGo.BitGo(options));
    this.set('session', Ember.RSVP.denodify(this._client.session));
    this.set('authenticate', Ember.RSVP.denodify(this._client.authenticate));
    this.set('login', Ember.RSVP.denodify(this._client.login));
    this.set('logout', Ember.RSVP.denodify(this._client.logout));
  }
});
