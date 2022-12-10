# NFTickets - dapp mobile

This project uses the React Native Expo library. Please see [expo.dev](https://expo.dev/) for full documentation.

This app leverages the [WalletConnect Example on Expo](https://github.com/clxyder/walletconnect-expo-example) template by clxyder

## Instructions

Navigate to the DAPP_WEB directory:

```
cd DAPP_MOBILE
```

Install the dependencies:

```
yarn
```

Create a ```.env``` file as per the ```.env.example``` file and populate it with your key.

To obtain the ```REACT_APP_NFT_STORAGE_KEY``` visit [nft.storage](https://nft.storage/)

### Local testing

Start the app in expo:

```
yarn start
```

Then open with Expo Go on your phone.

### Publishing

To publish the app via Expo/EAS:

```
npm install -g eas-cli
```

OR if you require elevated privileges:

```
sudo npm install -g eas-cli
```

Login with your Expo details - *You will need to have an expo account*

```
eas login
```

Then enter your credentials as prompted.

Configure your project for deployment:

```
eas build:configure
```

You will need to update the ```app.config.ts``` file, un-comment lines 97-99, and update wirh the project ID you are provided.

You may need to re-run the ```eas build:configure``` command if this is your first deployment, and select the mobile platform you wish to deploy to.

Build your app:

```
eas build -p android --profile preview
```

*Due to the recent changes to Apple's rules around NFTs and payment, an iOS app deployment has not been tested at the time of writing these instructions.*