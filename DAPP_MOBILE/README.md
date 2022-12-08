# NFTickets

This app leverages the WalletConnect Example on Expo template by clxyder

create .env file as per the .env.example (obtain your own api key from nft.storage)
run commands: 
To install expo and all the rest
yarn

to start app in expo:
yarn start

to publish: 
npm install -g eas-cli

may need

sudo npm install -g eas-cli


eas login

login with your expo details

eas build:configure

you may need to select yes to create an EAS project the first time and select the mobile platform you are building the app for

You will likely see something like this: 

Warning: Your project uses dynamic app configuration, and the EAS project ID can't automatically be added to it.
https://docs.expo.dev/workflow/configuration/#dynamic-configuration-with-appconfigjs

To complete the setup process, set "extra.eas.projectId" in your app.config.ts:

{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXX"
      }
    }
  }
}

Go to app.config.ts

add the projectID provided by EAS into your app.config.ts on line 97 just after: apiUrl: process.env.API_URL in the following format:

eas: {
      projectId: "57335231-1972-4422-bad0-be0bcf8d72b0",
    }


To build a preview APK and not for the app store, modify your eas.json file:

old content:
{
  "cli": {
    "version": ">= 2.8.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}

new content:
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "preview2": {
      "android": {
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "preview3": {
      "developmentClient": true
    },
    "production": {}
  }
}



then run:

eas build -p android --profile preview

and follow the prompts (select the mobile platform, generate a new Android Keystore, etc..)

Your build will likely take a few minutes :)

If your build fails due to 
Build file '/home/expo/workingdir/build/DAPP_MOBILE/node_modules/react-native-tcp/android/build.gradle' line: 47

> Could not find method compile() for arguments [com.facebook.react:react-native:+] on object of type org.gradle.api.internal.artifacts.dsl.dependencies.DefaultDependencyHandler.

try this (remember to close the terminal and open a new one and log back into eas or it will not detect the chenge to implemintation): 
https://stackoverflow.com/questions/72951365/could-not-find-method-compile-for-arguments-com-facebook-reactreact-native

If still failing as expo isn't detecting the changes from compile to implemintation, try:

expo eject

then use android studio to build the APKs