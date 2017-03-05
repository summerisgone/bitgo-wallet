import Ember from 'ember';
import BitGo from 'npm:bitgo';

export default Ember.Service.extend({
  init() {
    this.set('client', new BitGo.BitGo());
    // window.Bitgo = BitGo;
  }
});
