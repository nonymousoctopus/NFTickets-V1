import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, TouchableOpacity, Image, Dimensions, Modal, ScrollView, TextInput, Button } from 'react-native';
import React, { useState, useEffect } from 'react';
import { FontAwesome } from '@expo/vector-icons';

import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';

import { useWalletConnect } from '@walletconnect/react-native-dapp';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { ethers } from "ethers";
import NFTicketsTic_abi from './../abis/NFTicketsTic.json'
import NFTicketsMarket_abi from './../abis/NFTicketsMarket.json'


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
const HostedItem = (props: any) => {
  const [hostedItemModal, setHostedItemModal] = useState(false);

  const openModal = async (passedValue: any) => {
    setHostedItemModal(true);
  }
  const closeModal = async () => {
    setHostedItemModal(false);
  }

  const [tickets, setTickets] = useState(null);
  
  const testForm = () => {
    alert(tickets);
  }


  /******************************************************* */
  // SCAN QR FOR HOSTED EVENT
  /******************************************************* */

  const [qrModal, setQrModal] = useState(false);

  const openQrModal = async (passedValue: any) => {
    setQrModal(true);
  }
  const closeQrModal = async () => {
    setQrModal(false);
  }


  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ type, data }) => {
    verifyTicket(itemId, data, nftContract);

  };

  const connector = useWalletConnect();
  const [attendance, setAttendance] = useState(null);
  const [format, setFormat] = useState(false);

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
  let marketContract = new ethers.Contract(NFTicketsMarket_abi.address, NFTicketsMarket_abi.abi, signer);
  const marketWithSigner = marketContract.connect(signer);

  const verifyTicket = async (itemId, signature, nftContract) => {
    await provider.enable();
    let tx = await marketWithSigner.hostActions(itemId, signature, nftContract); 
    if (tx === 'On the list') {
      setFormat(true);
    } else {
      setFormat(false);
    }
    setAttendance(tx);
    setScanned(true);
  }


  //const { testVal1, testVal2 } = props;
  const { price, name, image, tokenId, sold, available, start, status, location, startFull, finish, description, nftContract, itemId } = props;
  return (
    
    <View style={styles.marketItem}>
      <Modal visible={hostedItemModal} animationType='slide' onRequestClose={() => closeModal()}>
        { /******************************************************* */
          // START OF QR SCANNER MODAL
          /******************************************************* */}
        <Modal visible={qrModal} animationType='slide' onRequestClose={() => closeQrModal()}>
          <ScrollView>
            <View style={styles.marketItemScanContainer}>
              <TouchableOpacity onPress={() => closeQrModal()}>
                <FontAwesome name="close" size={25} style={styles.backButton} />
              </TouchableOpacity>
              <Text style={styles.headingIndent}>Scanning tickets for {name}</Text>
              <View style={styles.reScanArea}>
                {scanned && <TouchableOpacity style={styles.scanButton} onPress={() => [setScanned(false), setAttendance(null)]}>
                  <Text style={styles.buyButtonText}>SCAN AGAIN</Text>
                </TouchableOpacity>}
                {format ? ( <Text style={styles.allowed}>{attendance}</Text>) : <Text style={styles.notAllowed}>{attendance}</Text>}
              </View>
              <View style={styles.scannerArea}>
                
                <Camera
                  onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barCodeScannerSettings={{
                    barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
                  }}
                  ratio='16:9'
                  style={[StyleSheet.absoluteFill, styles.scanner]}
                />                
              </View>
            </View> 
            
          </ScrollView> 
        </Modal>
        { /******************************************************* */
          // END OF QR SCANNER MODAL
          /******************************************************* */}
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
          <Text style={styles.detailsItemText}>Status: {status}</Text>
          <Text style={styles.detailsItemText}>Price: ${price/100}</Text>
          <Text style={styles.detailsItemText}>Tickets sold: {sold}</Text>
          <Text style={styles.detailsItemText}>Tickets left: {available}</Text>
          <Text style={styles.detailsItemText}>Description: {description}</Text>
          <Text style={styles.actionsHeading}>Seller actions:</Text>

          

          <View style={styles.ticketsInputArea}>
          <TextInput style={styles.ticketsInput} placeholder='1' keyboardType='numeric' onChangeText={(val) => setTickets(val)}/>
          <TouchableOpacity style={styles.addButton} onPress={() => testForm()}>
            <Text style={styles.buyButtonText}>Add tickets to market</Text>
          </TouchableOpacity>
          </View>        
          <TouchableOpacity style={styles.scanButton} onPress={() => [openQrModal(true), setScanned(false), setAttendance(null)]}>
            <Text style={styles.buyButtonText}>SCAN</Text>
          </TouchableOpacity>
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
        <Text style={styles.itemText}>Date: {start}</Text>
        <Text style={styles.itemText}>Status: {status}</Text>
        </View>
        <View style={styles.marketItemInfoRight}>
        <Text style={styles.itemText}>${price/100}</Text>
        <Text style={styles.itemText}>{sold} tickets sold</Text>
        <Text style={styles.itemText}>{available} tickets left</Text>
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
  marketItemScanContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column',
  },
  headingIndent: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#254E70',
    paddingLeft: windowWidth * 0.04,
    paddingBottom: windowHeight * 0.02,
  },
  scannerArea: {
    backgroundColor: 'green',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: windowWidth * 0.92,
    height: windowWidth * 0.92,
    margin: windowWidth * 0.04,
    borderRadius: 8,
  },
  scanner: {
    width: windowWidth * 0.92,
    height: (windowWidth * 0.92) * 16 / 9,
    overflow: 'hidden',
  },
  reScanArea: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: windowWidth * 0.92,
    margin: windowWidth * 0.04,
  },
  allowed: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#67D8AE',
  },
  notAllowed: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC0445',
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

export default HostedItem 