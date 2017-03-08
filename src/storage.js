'use strict';

module.exports.setItem = (key, value) => {
    return localStorage.setItem(key, value);
};

module.exports.getItem = (key) => {
    return localStorage.getItem(key);
};