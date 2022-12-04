import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';

import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types';
import MarketItem from '../components/MarketItem';

import { useWalletConnect } from '@walletconnect/react-native-dapp';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { ethers } from "ethers";
import NFTicketsTic_abi from './../abis/NFTicketsTic.json'


const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(
    address.length - 4,
    address.length
  )}`;
}

const values = [{testVal1: "Text value", testVal2: 99}, {testVal1: "Another text", testVal2: 0.89}];

export default function TabOneScreen({ navigation }: RootTabScreenProps<'TabOne'>) {

  const connector = useWalletConnect();
  const [reply, setReply] = useState(null);

  const provider = new WalletConnectProvider({
    rpc: {
      43113: 'https://api.avax-test.network/ext/bc/C/rpc',
    },
    chainId: 43113,
    connector: connector,
    qrcode: false,
  });
  //await provider.enable();
  //console.log('got past await');
 
const ethers_provider = new ethers.providers.Web3Provider(provider);
const signer = ethers_provider.getSigner();
let ticketContract = new ethers.Contract(NFTicketsTic_abi.address, NFTicketsTic_abi.abi, signer);
const contractWithSigner = ticketContract.connect(signer);
const nest = async () => {
  //console.log('Testing');
  await provider.enable();
  //console.log('awaited');
  let tx = await contractWithSigner.uri('1');  
  //console.log(tx)
  setReply(tx);
  //alert(tx);
}
  //const connector = useWalletConnect();

  const connectWallet = React.useCallback(() => {
    return connector.connect();
  }, [connector]);

  const killSession = React.useCallback(() => {
    return connector.killSession();
  }, [connector]);

  const testFunction = () => {
    alert('This works!');
  };

  return (
    <ScrollView>
    <View style={styles.marketScreen}>
      <Text style={styles.heading}>Upcomming Events</Text>
      <TouchableOpacity onPress={() => nest()}>
        <Text>Try Me!</Text>
        <Text>{reply}</Text>
      </TouchableOpacity>
      {values.map((value) => (
        <MarketItem key={value.testVal2} testVal1={value.testVal1} testVal2={value.testVal2} />
      ))}
    </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  marketScreen: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: windowWidth * 0.02,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#254E70',
    paddingLeft: windowWidth * 0.02,
    paddingBottom: windowHeight * 0.02,
  },
  marketItem: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
	    width: 0,
	    height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 5,
    marginBottom: 15,
    borderRadius: 8,
    padding: windowWidth * 0.02,
  },
  itemHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#254E70',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#63677F',
  },





  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  buttonStyle: {
    backgroundColor: "#3399FF",
    borderWidth: 0,
    color: "#FFFFFF",
    borderColor: "#3399FF",
    height: 40,
    alignItems: "center",
    borderRadius: 30,
    marginLeft: 35,
    marginRight: 35,
    marginTop: 20,
    marginBottom: 20,
  },
  buttonTextStyle: {
    color: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    fontWeight: "600",
  },
});
