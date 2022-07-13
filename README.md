# Telos Works SC

# Telos Works Contracts
A funding platform for Telos Works 3.0 projects and proposals.

## Dependencies

* eosio.cdt
* nodeos, cleos, keosd

## Setup

To begin, navigate to the project directory: `telosbuild/`

    mkdir build

    chmod +x build.sh && chmod +x deploy.sh && chmod +x test.sh

The `telosbuild` contract has already been implemented and is build-ready.

## Build

    ./build.sh telosbuild

## Deploy

    ./deploy.sh telosbuild ????? { mainnet | testnet | local }

## Test 

    ./test.sh telosbuild

# Documentation

### [User Guide](docs/UserGuide.md)

### [Telos Works 3.0 Contract API](docs/ContractAPI.md)
