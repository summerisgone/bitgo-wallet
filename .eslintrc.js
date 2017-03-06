module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true
    },
    "extends": [
        "eslint:recommended", "plugin:react/recommended"
    ],
    "plugins": [
        "standard", "promise", "react"
    ],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "rules": {
        "no-trailing-spaces": "error",
        // "no-var": "error",
        "indent": [
            "error", 4
        ],
        "linebreak-style": [
            "error", "unix"
        ],
        "quotes": [
            "error", "single"
        ],
        "semi": ["error", "always"]
    }
}