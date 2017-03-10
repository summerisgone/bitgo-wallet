# bitgo-wallet

[![Code Climate](https://lima.codeclimate.com/github/summerisgone/bitgo-wallet/badges/gpa.svg)](https://lima.codeclimate.com/github/summerisgone/bitgo-wallet)
[ ![Codeship Status for summerisgone/bitgo-wallet](https://app.codeship.com/projects/0b2ecf50-e7ed-0134-482d-6afd4ced9a7c/status?branch=master)](https://app.codeship.com/projects/207282)

# Walkthrough


## Set up BitGo developer account

- create account at [test.bitgo.com/wallet](https://test.bitgo.com/wallet)
- install [Google Authenticator](https://support.google.com/accounts/answer/1066447) on your smartphone (they ask you fro 2-factor auth)
- Create at leat another one wallet to test money send feature

## Earn money

To earn some testnet coins, use [testnet faucet](http://tpfaucet.appspot.com/) or find in Google another one.

Then you will need your **receive address**, you should follow "Wallets > My BitGo Wallet > Receive" on [test.bitgo.com](https://test.bitgo.com/enterprise/personal/wallets). 
Then send test coins from faucet to your wallet.

![receive coins](http://i.imgur.com/7F5YA4D.gif)


## Application

It allows to log in and view current ballance.

![Login](http://i.imgur.com/0tJw8pS.gif)

In order to send coins you will need "Unlock session"

![Unlock](http://i.imgur.com/wiEr75Q.gif)

and probably another wallet address

![send money](http://i.imgur.com/pj2qPJp.gif)

# Developemnt

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

### Development

Follow [Dev Guide](docs/devguide.md) for further information about app.
