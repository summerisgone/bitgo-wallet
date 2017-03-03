import {test} from 'qunit';
import moduleForAcceptance from 'bitgo-wallet/tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | show wallet id');

test('Frontpage works', function(assert) {
  visit('/');
  andThen(function() {
    assert.equal(currentURL(), '/');
  });
});

test('show  wallet ID', function(assert) {
  visit('/main');
  andThen(function() {
    assert.ok(find('.wallet-id').text().length > 0, 'should have text in .wallet-id div');
  });
});