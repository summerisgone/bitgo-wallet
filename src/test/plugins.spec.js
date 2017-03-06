const plugins = require('../plugins');
const assert = require('assert');


describe('plugins', function() {
    it('exports list of plugins', () => {
        assert.ok(plugins.length);
    });
});
