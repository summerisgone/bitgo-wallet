'use strict';
const assert = require('assert');
const rx = require('rxjs');

class Connection {
    constructor (options) {
        this.options = Object.assign({}, options);
        assert(this.options.plugins, 'options.plugins is required');
        assert(this.options.plugins.length, 'options.plugins should be array of plugins');
        this.collectPlugins(this.options.plugins);
    }
    collectPlugins (plugins) {
        // pre-register
        this._pluginFns = {};
        plugins.forEach(plugin => {
            assert(plugin.name, `Plugin name should be defined for ${plugin}`);
            this._pluginFns[plugin.name] = plugin;
        });
        // instantiate
        this.plugins = {};
        plugins.forEach(plugin => {
            this.plugins[plugin.name] = this.inject(plugin.name);
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
