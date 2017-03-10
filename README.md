# bitgo-wallet

[![Code Climate](https://lima.codeclimate.com/github/summerisgone/bitgo-wallet/badges/gpa.svg)](https://lima.codeclimate.com/github/summerisgone/bitgo-wallet)
[ ![Codeship Status for summerisgone/bitgo-wallet](https://app.codeship.com/projects/0b2ecf50-e7ed-0134-482d-6afd4ced9a7c/status?branch=master)](https://app.codeship.com/projects/207282)

## [Walkthrough use cases](docs/waltkthrough.md)

## [Development Guide](docs/devguide.md)

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (with NPM)

Also you will need BitGo test network account, get it on [test.bitgo.com](http://test.bitgo.com/).

## Installation and build

* `git clone <repository-url>` this repository
* `cd bitgo-wallet`
* `npm install`
* `npm run build`

## Running built-in development server

* `npm start`
* Visit your app at [http://localhost:8080](http://localhost:8080).

### Running Tests

* `npm run lint`
* `npm test`
* `npm run coverage`