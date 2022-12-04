import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, TouchableOpacity, Image, Dimensions, Modal, ScrollView, TextInput } from 'react-native';
import React, { useState, } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { ethers, utils } from "ethers";
import { keccak256 } from "ethers/lib/utils";
import { useWalletConnect } from '@walletconnect/react-native-dapp';
import WalletConnectProvider from '@walletconnect/web3-provider';

import NFTicketsMarket_abi from './../abis/NFTicketsMarket.json'
import NFTicketsUtils_abi from './../abis/NFTicketsUtils.json'



import Colors from '../constants/Colors';
import { MonoText } from './StyledText';
import { Text, View } from './Themed';

const SampleEvent = [{name: "Event 1", price: 0.99, image: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Daisy_pollen_flower_220533.jpg', amount: 5}];
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const testFunction = (value: any) => {
  alert(value);
};



//export default function MarketItem({ path }: { path: string }) {
const MarketItem = (props: any) => {
  const [itemModal, setItemModal] = useState(false);

  const openModal = async (passedValue: any) => {
    setItemModal(true);
  }
  const closeModal = async () => {
    setSuccessMessage(false);
    setItemModal(false);
  }

  const [tickets, setTickets] = useState(null);
  
  const testForm = () => {
    alert(tickets);
  }


  /******************************************************* */
  // BUY TICKET
  /******************************************************* */

  const connector = useWalletConnect();
  const [purchaseMessage, setPurchaseMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  

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

  const buyTickets = async (priceInCents, nftContractAddress, itemId) => {
    setPurchaseMessage(true);
    //console.log('started buy')
    
      await provider.enable();
      let utilsContract = new ethers.Contract(NFTicketsUtils_abi.address, NFTicketsUtils_abi.abi, signer);
      let perTicketPrice = await utilsContract.getConversion(priceInCents);
      let payment = perTicketPrice * tickets;
      //console.log(payment);

      let marketContract = new ethers.Contract(NFTicketsMarket_abi.address, NFTicketsMarket_abi.abi, signer);
      const marketWithSigner = marketContract.connect(signer);
      //let marketContract = new ethers.Contract(NFTicketsMarket_abi.address, NFTicketsMarket_abi.abi, signer);

      let tx = await marketWithSigner.buyMarketItem(nftContractAddress, itemId, tickets, '0x00', {value: (payment.toString())});
      //console.log(tx);
      setPurchaseMessage(false);
      setSuccessMessage(true);
  }

  const { price, name, image, tokenId, available, start, location, startFull, finish, description, nftContract, itemId } = props;
  //const { price, name, image, tokenId, start, location, startFull, finish, description, nftContract, itemId, amount } = props;
  return (
    
    <View style={styles.marketItem}>
      <Modal visible={itemModal} animationType='slide' onRequestClose={() => closeModal()}>
      <ScrollView>
        <View style={styles.marketItemDetailsContainer}>
        <TouchableOpacity onPress={() => closeModal()}>
          <FontAwesome name="arrow-left" size={25} style={styles.backButton} />
          </TouchableOpacity>
          <Image source={{ uri: image }} style={styles.detailsEventImage}/>
          <View style={styles.marketItemDetailsInner}>
          <Text style={styles.heading}>{name}</Text>
          <Text style={styles.detailsItemText}>Location: {location}</Text>
          <Text style={styles.detailsItemText}>Start: {startFull}</Text>
          <Text style={styles.detailsItemText}>Finish: {finish}</Text>
          <Text style={styles.detailsItemText}>Price: ${price/100}</Text>
          <Text style={styles.detailsItemText}>Description: {description}</Text>
          <Text style={styles.detailsItemText}>Tickets: {available}</Text>
          <Text style={styles.actionsHeading}>Purchase tickets:</Text>
          <View style={styles.ticketsInputArea}>
            <TextInput style={styles.ticketsInput} placeholder='1' keyboardType='numeric' onChangeText={(val) => setTickets(val)}/>
            <TouchableOpacity style={styles.addButton} onPress={() => buyTickets(price, nftContract, itemId)}>
              <Text style={styles.buyButtonText}>Buy tickets</Text>
            </TouchableOpacity>
          </View>  
          {purchaseMessage ? (
            <Text style={styles.purchaseMessage}>Purchasing ticket(s), please approve the transaction.</Text> 
          ) : null}
          {successMessage ? (
            <Text style={styles.purchaseMessage}>Purchase successful!</Text> 
          ) : null}      
          </View>
          
        </View> 
        </ScrollView>     
      </Modal>
      <TouchableOpacity onPress={() => openModal(tokenId)}>
      <Image source={{ uri: image }} style={styles.eventImage}/>
      <View style={styles.marketItemInfo}>
      <Text style={styles.itemHeading}>{name}</Text>
      <View style={styles.marketItemInfoBottom}>
        <View style={styles.marketItemInfoLeft}>
        <Text style={styles.itemText}>Location: {location}</Text>
        <Text style={styles.itemText}>Start: {start}</Text>
        </View>
        <View style={styles.marketItemInfoRight}>
        <Text style={styles.itemText}>${price/100}</Text>
        <Text style={styles.itemText}>{available} tickets avalaible</Text>
        </View>
      </View>
      </View>
      </TouchableOpacity>
    </View>
  );
}

function handleHelpPress() {
  WebBrowser.openBrowserAsync(
    'https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet'
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
    borderRadius: 8,
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
  },
  marketItemInfo: {
    padding: windowWidth * 0.02,
    borderRadius: 8,
  },
  marketItemInfoBottom: {
    flexDirection: 'row',
    alignContent: 'flex-start',
  },
  marketItemInfoLeft: {
    flexDirection: 'column',
    alignContent: 'flex-start',
    width: '65%',
    paddingRight: windowWidth * 0.02,
  },
  marketItemInfoRight: {
    flexDirection: 'column',
    alignContent: 'flex-end',
    alignItems: 'flex-end',
    width: '35%',
    paddingLeft: windowWidth * 0.02,
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
  eventImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    resizeMode: 'cover',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  backButton: {
    color:'#34374A', 
    paddingTop: windowHeight * 0.02,
    paddingLeft: windowWidth * 0.04,
    paddingBottom: windowHeight * 0.02,
  },
  detailsEventImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    resizeMode: 'cover',
  },
  detailsItemText: {
    fontSize: 20,
    fontWeight: '400',
    color: '#63677F',
    paddingLeft: windowWidth * 0.02,
  },
  ticketsInputArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketsInput: {
    borderWidth: 1,
    borderColor: '#AFB1C1',
    padding: windowWidth * 0.02,
    margin: windowWidth * 0.02,
    width: windowWidth * 0.25,
    borderRadius: 8,
    fontSize: 20,
  },
  actionsHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#254E70',
    paddingLeft: windowWidth * 0.02,
    paddingTop: windowHeight * 0.02,
  },
  scanButton: {
    width: windowWidth * 0.92,
    margin: windowWidth * 0.02,
    backgroundColor: '#254E70',
    borderRadius: 8,
  },
  buyButtonText: {
    padding: windowWidth * 0.02,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    alignSelf: 'center',
  },
  addButton: {
    width: windowWidth * 0.63,
    margin: windowWidth * 0.02,
    backgroundColor: '#67D8AE',
    borderRadius: 8,
  },
  code: {
    alignSelf: "center",
    marginTop: windowHeight * 0.02,
    marginBottom: windowHeight * 0.02,
  },
  purchaseMessage: {
    color: '#67D8AE',
    fontSize: 16,
    marginLeft: windowWidth * 0.02,
  },

  simpleButton: {
    backgroundColor: 'blue',
  },

  marketItemDetailsContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column',
  },
  marketItemDetailsInner: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: windowWidth * 0.02,
    flexDirection: 'column',
  },




  eventContainer: {
    borderRadius: 8,
    width: windowWidth * 0.96,
  },
  
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightContainer: {
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: 15,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    textAlign: 'center',
  },
});

export default MarketItem 