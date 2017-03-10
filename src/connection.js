'use strict';
const assert = require('assert');
const rx = require('rxjs');

class Connection {
    constructor (options) {
        this.options = Object.assign({}, options);
        assert(this.options.plugins, 'options.plugins is required');
        this.collectPlugins(this.options.plugins);
    }
    collectPlugins (plugins) {
        // pre-register
        this._pluginFns = {};
        Object.keys(plugins).forEach(key => {
            const plugin = plugins[key];
            assert(key, `Plugin name should be defined for ${plugin}`);
            assert(!this._pluginFns[key], `Plugin ${key} already registered`);
            this._pluginFns[key] = plugin;
        });
        // instantiate
        this.plugins = {};
        Object.keys(plugins).forEach(key => {
            this.plugins[key] = this.inject(key);
        });
    }
    inject (pluginName) {
        const pluginFn = this._pluginFns[pluginName];
        assert(pluginFn, `Can't instantiate plugin ${pluginName}: it is ${this._pluginFns[pluginName]}`);
        const instance = this.plugins[pluginName] || this.create(pluginFn);
        this.plugins[pluginName] = instance;
        assert(instance instanceof rx.Observable, `Plugin ${pluginName} doesn't return rx.Observable instance`);
        return instance;
    }
    create (pluginFn) {
        try {
            return pluginFn(this);
        } catch (err) {
            assert(false, `Can't create plugin instance for ${pluginFn.name}, ${err.message}`);
            throw err;
        }
    }
}
module.exports = Connection;
