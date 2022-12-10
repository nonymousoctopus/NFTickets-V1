# NFTickets-V1

NFTickets is at this stage a proof-of-concept application, allowing users to list tickets to real-world events on the blockchain. Allowing both event organisers and ticket purchasers to benefit from reduced fees and trust minimised open source contracts, penaliseing bad behaviour, and allowing token holders who vote on dispouted events to receive rewards for their participation. 

## Improvements

This mono-repo improves the NFTickets dapp initially designed during the Chainlink 2022 Spring Hackathon:

* Improved Smart contract design - added dispute mechanism with simple voting/arbitration via ERC20 token
* Fixed event access by name vulnerability
* Added Channlink Keepers/Automation functionality for automatic payments and dispute processing
* Added React JS Web front end for easier event creation, administration and arbitration
* Redesigned Mobile app for Android and iOS with React Native Expo
    * iOS app not tested/published due to recent changes to NFT payments on iOS
    * Android app apk published but not depployed to app store as NFTickets is in ALPHA stage
* Removed reliance on Moralis - switched asset hosting to nft.storage and RPC to Alchemy for long term deployment
* Added simple documentation, guides and FAQs.

## Instructions

Clone this repository to your machine:

```
git clone https://github.com/nonymousoctopus/NFTickets-V1.git
```

Navigate into the NFTickets-V1 directory:

```
cd NFTickets-V1
```

### Smart contracts

[Click here for instructions on setting up and deploying the smart contract](SMART_CONTRACTS/README.md)

### Website

[Click here for instructions on setting up and deploying the web front end on IPFS](DAPP_WEB/README.md)

### Mobile

[Click here for instructions on setting up and deploying the mobile application](DAPP_MOBILE/README.md)



- Improvements to exisiting smart contract (security and feature enhancements)
- Development of a web based front end for event hosts and customer - to be hosted on IPFS/Filecoin
- Development of an iOS version of the app
- Improvements of the Android version of the app
- Development of event verification and complaints functionality, leveraging IPFS/Filecoin for evidence storage
- Documentation and user guides

Deploying SMART_CONTRACTS:
npx hardhat deploy --network fuji
npx hardhat run scripts/Setup.js --network fuji