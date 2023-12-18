# PowerPool Agent Safe Module

>## The code is not audited yet! Use on your own risk!

## Overview

PowerPool Agent Safe Module allows users to automate transactions on their Safe wallets using
PowerPool automation network.


```
                   exec()                execTransactionFromModule()
                    |                                |
     +---------+    |       +------------------+     |     +------------------+
     |         |    |       |                  |     |     |                  |
     | PPAgent |----------->|  PPAgent Module  |---------->|    Safe Wallet   |
     |         |            |                  |           |                  |
     +---------+            +------------------+           +------------------+

```

## Setup

Fullfill `.env` file:
```
# [Required] Private key of a deployer wallet and of the Safe owner
DEPLOYER_PRIVATE_KEY='...'

# Address of a Safe wallet which will use module
SAFE_WALLET_ADDRESS='0x...'

# [Optional]
GNOSISSCAN_API_KEY='...'
```
run
```
npm i
npx hardhat compile
```

## Deploy

To deploy the module contract run:

```
npx hardhat deploy --network <NETWORK>

```

## Run

To enable the module on your Safe wallet and run test job run:

```
npx hardhat run scripts/enableModule.ts --network <NETWORK>
```
