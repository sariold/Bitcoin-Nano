# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Versions

web3: ``1.7.4``
truffle: ``5.5.20``
solidity: ``0.8.15``
npm: ``8.5.0``
node: ``16.14.2``

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

I used Ganache UI with the following mnemonic:

```worth power liberty kangaroo eternal antenna rigid frost patient water ketchup main```

and set account size to 30 with default ether balance of 10,000.

``truffle-config.js`` is configured to use the above Ganache UI local blockchain on port 9545.

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

These are the 18 flightSurety.js tests:

``` 
✔ (multiparty) has correct initial isOperational() value (2243ms)
✔ (multiparty) has correct changed isOperational() value (863ms)
✔ (multiparty) can block access to setOperatingStatus() for non-Contract Owner account (440ms)
✔ (multiparty) can allow access to setOperatingStatus() for Contract Owner account (1334ms)
✔ (multiparty) can block access to functions using requireIsOperational when operating status is false (2899ms)
✔ (airline) cannot register an Airline using registerAirline() if there exist less than 4 registered airlines and it is not original airline (105ms)
✔ (airline) can register an Airline using registerAirline() if it is not funded (822ms)
✔ (airline) can be registered but not participate in the system until it is funded (159ms)
✔ (airline) can go from not funded to funded (583ms)
✔ (airline) cannot register a new airline when there are 4 or more airlines, group consensus must be made (3279ms)
✔ (airline) can register airline if 50% consesus is reached through voting (4313ms)
✔ (airline) cannot register airline if 50% consesus is not reached through voting (2698ms)
✔ Can register and retrieve a flight (2287ms)
✔ (passenger) cannot buy insurance for an unfunded flight (8677ms)
✔ (passenger) cannot buy insurance for more than 1 ether per flight (398ms)
✔ (passenger) can go from uninsured to insured after buying insurance for a flight (654ms)
✔ (passenger) can withdraw their 1.5x insurance claim for a flight if they have credits (2149ms)
✔ (passenger) cannot withdraw if they do not have credits (159ms)
```

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
