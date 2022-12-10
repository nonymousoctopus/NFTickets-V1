# NFTickets - smart contracts

This project uses the Hardhat development enviornment. Please see [hardhat.org](https://hardhat.org/) for full documentation.

## Instructions

Navigate to the SMART_CONTRACTS directory:

```
cd SMART_CONTRACTS
```

Install the dependencies:

```
npm install
```

Create a ```.env``` file as per the ```.env.example``` file and populate it with your keys.

*You may need to update the hardhat.config.js file if you choose to use a different blockchain, please remember to adjust your deployment comands accordingly.*

Compile the contracts:

```
npx hardhat compile
```

### Deployment

Deploy to the Avalanche Fuji testnet

```
npx hardhat deploy --network fuji 
```

Run the set up scripts to finalise your contract deployment:

```
npx hardhat run scripts/Setup.js --network fuji
```

### Preparation for web and mobile deployments

Copy the ABIs for web and mobile deployments:

```
npx hardhat run scripts/CopyABIs.js 
```

### Chainlink Automation set up

Go to [automation.chain.link](https://automation.chain.link) and register a new upkeep for the arbitration decision executions with the following settings:

| Trigger                   | Time-based                                               |
| Target contract address   | address of your deployed NFTicketsArbitration contract   |
| Target function           | executeDecisionsWhenNeeded                               |
| Cron expression           | 0 0 * * *                                                |

Fill in the rest of the details as you see fit.

Repeat the above steps for the payments function with the following settings:

| Trigger                   | Time-based                                               |
| Target contract address   | address of your deployed NFTicketsArbitration contract   |
| Target function           | executePaySellers                                        |
| Cron expression           | 1 0 * * *                                                |

## Website deployment

It is recommended that you set up the website before deploying the mobile app as it allows you to create events. 

Navigate out of this directory to proceed:

```
cd ..
```

[Click here for proceed with setting up and deploying the web front end on IPFS](./../DAPP_WEB/README.md)

## Mobile app deployment

You can now set up and deploy your mobile app.

Navigate out of this directory to proceed:

```
cd ..
```

[Click here for proceed with setting up and deploying the mobile app](./../DAPP_MOBILE/README.md)