import { StyleSheet, TouchableOpacity, ScrollView, Dimensions, RefreshControl } from 'react-native';
import React, { useState, useEffect } from 'react';

import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import HostedItem from '../components/HostedItem';

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

import { useWalletConnect } from '@walletconnect/react-native-dapp';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { ethers } from "ethers";
import NFTicketsTic_abi from './../abis/NFTicketsTic.json'
import NFTicketsMarket_abi from './../abis/NFTicketsMarket.json'

const values = [{testVal1: "Text value", testVal2: 99}, {testVal1: "Another text", testVal2: 0.89}];

const wait = timeout => {
  return new Promise(resolve => setTimeout(resolve, timeout));
};

const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(
    address.length - 4,
    address.length
  )}`;
}

export default function MyEventsScreen() {

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    drawMyEventsGallery();
    wait(2000).then(() => setRefreshing(false));
  }, []); 

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

  const ethers_provider = new ethers.providers.Web3Provider(provider);
  const signer = ethers_provider.getSigner();
  let ticketContract = new ethers.Contract(NFTicketsTic_abi.address, NFTicketsTic_abi.abi, signer);
  const ticketWithSigner = ticketContract.connect(signer);

  /******************************************************* */
  // MY EVENTS LOADING FUNCTIONS
  /******************************************************* */

  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState([]);
  
  let marketContract = new ethers.Contract(NFTicketsMarket_abi.address, NFTicketsMarket_abi.abi, signer);
  const marketWithSigner = marketContract.connect(signer);

  async function drawMyEventsGallery () {
    let tempEvents:any = [];
    await provider.enable();
    let result = await marketContract.fetchMyNFTs();
    //console.log('Testing...')
    //console.log(result);
    for (let i=0; i < result.length; i++) {
      let rawURI = await ticketContract.uri(result[i].tokenId.toNumber());
      let cleanURI = 'https://nftstorage.link/ipfs/' + rawURI.replace("ipfs://", "");
      let data = await fetch(cleanURI).then((response) => response.json()); // getting the JSON data from the uri in the NFT

      let existingTest = false;
      for (let j=0; j<tempEvents.length; j++) {
        if (tempEvents[j].itemId == result[i].itemId.toNumber()) {
          existingTest = true;
        }
      }
      if (existingTest === false) {
        let imgLoad = await data['image'].replace("ipfs://", "https://nftstorage.link/ipfs/");
        let statusNumber = await result[i].status;
        let status = await statusConversion(statusNumber);
        // Event quick view: key = itemId, name = name, sold = totalSales, price = price, tickets on sale = amount, event start = need to get from ipfs, status = status
        tempEvents.push({
          itemId: result[i].itemId.toNumber(), 
          name: result[i].name, 
          price: result[i].price.toNumber(), 
          image: imgLoad, 
          tokenId: result[i].tokenId.toNumber(), 
          sold: result[i].initialQuantity.toNumber() - result[i].amount.toNumber(), 
          status: status, 
          start: data.start.slice(0,10), 
          available: result[i].amount.toNumber(), 
          location: data.location, 
          startFull: data.start, 
          finish: data.finish, 
          description: data.description,
          nftContract: result[i].nftContract, 
        })
      }
      existingTest = false;
    };
    setEvents(tempEvents);
    setLoading(false);
  }

  async function statusConversion (statusNumber:number) {
    if (statusNumber === 0) {
      return "Normal";
    } else if (statusNumber === 1) {
      return "Sales processed";
    } else if (statusNumber === 2) {
      return "In dispute";
    } else if (statusNumber === 3) {
      return "Dispute resolved in seller's favour";
    } else if (statusNumber === 4) {
      return "Dispute resolved in buyer's favour";
    } else if (statusNumber === 6) {
      return "Refunded by seller";
    }
  }

  useEffect(() => {
    (async () => {
        drawMyEventsGallery();
    })();
  }, []);


  //key={event.itemId} itemId={event.itemId} name={event.name} price={event.price} image={event.image} tokenId={event.tokenId} sold={event.sold} available={event.available} start={event.start} status={event.status} location={event.location} startFull={event.startFull} finish={event.finish} description={event.description} nftContract={event.nftContract}

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
    <View style={styles.marketScreen}>
      <Text style={styles.heading}>My Events</Text>
      {loading ? (
        <View style={styles.loadingScreen}> 
          <Text style={styles.loadingAnimation}>Loading ...</Text>
        </View>
      ) : null}
      {events.map((event) => (
        <HostedItem key={event.itemId} itemId={event.itemId} name={event.name} price={event.price} image={event.image} tokenId={event.tokenId} sold={event.sold} available={event.available} start={event.start} status={event.status} location={event.location} startFull={event.startFull} finish={event.finish} description={event.description} nftContract={event.nftContract} />
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
  loadingScreen: {
    flexDirection: 'column',
    alignSelf: 'center',
    alignItems: 'center',
    alignContent: 'space-around',
    width: windowWidth * 0.96,
    height: windowHeight,
    paddingTop: windowHeight * 0.25,
  },
  loadingAnimation: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#67D8AE',
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
