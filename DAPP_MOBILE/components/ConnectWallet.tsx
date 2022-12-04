import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { ImageBackground, StyleSheet, TouchableOpacity, ColorSchemeName } from 'react-native';
import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';

import { Text, View } from './Themed';


import { useWalletConnect } from '@walletconnect/react-native-dapp';
const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(
    address.length - 4,
    address.length
  )}`;
}

export default function ConnectWallet() {
  const colorScheme = useColorScheme();
  const connector = useWalletConnect();

  const connectWallet = React.useCallback(() => {
    return connector.connect();
  }, [connector]);

  const killSession = React.useCallback(() => {
    return connector.killSession();
  }, [connector]);

  return (
    
    <View style={styles.mininalContainer}>
      {!connector.connected && (
        <TouchableOpacity onPress={connectWallet} style={styles.buttonStyle}>
          <Text style={styles.buttonTextStyle}>Connect a Wallet</Text>
        </TouchableOpacity>
      )}
      {!!connector.connected && (
        <>
          <Text style={styles.addressText}>{shortenAddress(connector.accounts[0])}</Text>
          <TouchableOpacity onPress={killSession} style={styles.buttonStyle}>
            <Text style={styles.buttonTextStyle}>Log out</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mininalContainer: {
    height: 'auto',
    flexDirection: 'row',
    backgroundColor: useColorScheme.tint,
  },
  addressText: {
    alignSelf: 'center',
    color: "#3399FF",
  },
  buttonStyle: {
    backgroundColor: "#3399FF",
    borderWidth: 0,

    borderColor: "#3399FF",
    height: 40,
    alignItems: "center",
    borderRadius: 30,
    marginLeft: 15,
    marginRight: 15,
  },
  buttonTextStyle: {
    color: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    fontWeight: "600",
  },
});



