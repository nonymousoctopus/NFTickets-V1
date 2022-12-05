import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, TouchableOpacity, Image, Dimensions, Modal, ScrollView, TextInput } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { ethers, utils } from "ethers";
import { keccak256 } from "ethers/lib/utils";
import { useWalletConnect } from '@walletconnect/react-native-dapp';
import WalletConnectProvider from '@walletconnect/web3-provider';
import QRCode from 'react-native-qrcode-svg';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {Picker} from '@react-native-picker/picker';
//import { NFTStorage, File } from './../node_modules/nft.storage/dist/bundle.esm.min.js';
import {REACT_APP_NFT_STORAGE_KEY} from '@env';

import NFTicketsArbitration_abi from './../abis/NFTicketsArbitration.json'
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

const PurchasedItem = (props: any) => {
  const [purchasedModal, setPurchasedModal] = useState(false);

  const openPurchasedModal = async (passedValue: any) => {
    setPurchasedModal(true);
  }
  const closePurchasedModal = async () => {
    setShowQR(false);
    setSold(false);
    setPurchasedModal(false);
  }

  /******************************************************* */
  // LODGE DISPUTE ACTIONS
  /******************************************************* */

  const [disputeModal, setDisputeModal] = useState(false);
  const openDisputeModal = async (passedValue: any) => {
    setDisputeModal(true);
  }
  const closeDisputeModal = async () => {
    setDisputeSubmitted(false);
    setDisputeModal(false);
  }

  const [disputeDescription, setDisputeDescription] = useState();
  const [disputeReason, setDisputeReason] = useState(Number);
  const pickerRef = useRef();
  function open() {
    pickerRef.current.focus();
  }

  function close() {
    pickerRef.current.blur();
  }

  const [evidencePreview, setEvidencePreview] = useState(null);
  const [evidence, setEvidence] = useState(String);

  const [local, setLocal] = useState();
  const [errorMsg, setErrorMsg] = useState(null);
  useEffect(() => {
    (async () => {
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let locate = await Location.getCurrentPositionAsync({});
      setLocal(locate);
    })();
  }, []);

  //let text = 'Waiting..';

  const pickImageLive = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setEvidencePreview(result.assets[0].uri);
      uploadToIPFS(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (!result.canceled) {
      setEvidencePreview(result.assets[0].uri);
      uploadToIPFS(result.assets[0].uri);
    }
  };
  
  const uploadToIPFS = async (uri) => {
    const URL = 'https://api.nft.storage/upload';
    let upload = await FileSystem.uploadAsync(URL, uri, {
      headers: {
        'Authorization': 'Bearer ' + REACT_APP_NFT_STORAGE_KEY
      },
    });
    let trimmed = (upload.body).trim();
    let shortened = trimmed.substring(1,trimmed.length - 1);
    let noSlash = shortened.replace("\\","");
    let finalString = noSlash.substring(18);
    let stringToJson = JSON.parse(finalString);
    let cid = 'https://nftstorage.link/ipfs/' + stringToJson.cid;
    setEvidence(cid);
    //console.log(evidence);
  }
    
    /******************************************************* */
    // IPFS upload is problematic, can only upload using http api gateway, 
    // need to change the smartcontract and the dispute form to use a dropdown with a limited set of reasons
    // contract needs to use uint8 for reason selection
    // website needs to use reason number to display why the dispute is raised
    // need to update the lodging function to specify the number from the dropdown
    /******************************************************* */

  /******************************************************* */
  // GENERATE QR FOR TICKET
  /******************************************************* */

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
  const [ticketQR, setTicketQR] = useState();
  const [showQR, setShowQR] = useState(false);

  const tryNewAuth = React.useCallback(async (_message:any ) => {
    const kek256 = keccak256(utils.toUtf8Bytes(_message));
    const parameters = [connector.accounts[0], kek256];
    let signed = await connector.signPersonalMessage(parameters);
    //console.log(signed);
    setTicketQR(signed);
    setShowQR(true);
  }, [connector]);

  /******************************************************* */
  // RE-SELL TICKETs
  /******************************************************* */

  const [tickets, setTickets] = useState(null);
  const [reselling, setReselling] = useState(false);
  const [sold, setSold] = useState(false);

  /*
  const resellTicketsFunction = async (priceInCents, nftContractAddress, tokenId, amount, name) => {
    //console.log(itemId)
    if (tickets <= amount) {
      setReselling(true);
      await provider.enable();
      let utilsContract = new ethers.Contract(NFTicketsUtils_abi.address, NFTicketsUtils_abi.abi, signer);
      let perTicketPrice = await utilsContract.getConversion(priceInCents);

      let listingFee = perTicketPrice * amount / 5;

      let marketContract = new ethers.Contract(NFTicketsMarket_abi.address, NFTicketsMarket_abi.abi, signer);
      const marketWithSigner = await marketContract.connect(signer);
      let tx = await marketWithSigner.listNewMarketItem(nftContractAddress, tokenId, tickets, '0x00', name, {value: (listingFee.toString())});
      //console.log(tx);
      setReselling(false);
      setSold(true);
    } else {
      alert('You cannot re-sell more tickets than you own')
    }
  }
  */

  //nftContract, uint256 tokenId, uint256 itemId, uint256 amount, bytes memory data
  const reSellFunction = async (nftContractAddress, tokenId, itemId, amount) => {
    if (tickets <= amount) {
      setReselling(true);
      await provider.enable();

      let marketContract = new ethers.Contract(NFTicketsMarket_abi.address, NFTicketsMarket_abi.abi, signer);
      const marketWithSigner = await marketContract.connect(signer);
      let tx = await marketWithSigner.reSell(nftContractAddress, tokenId, itemId, tickets, '0x00');
      //console.log(tx);
      setReselling(false);
      setSold(true);
    } else {
      alert('You cannot re-sell more tickets than you own')
    }
  }

  /******************************************************* */
  // LODGE DISPUTE FOR TICKET
  /******************************************************* */

  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  const lodgeDisputeFunction = async (itemId) => {
    let lat = Math.round(local.coords.latitude*10000000000);
    let lon = Math.round(local.coords.longitude*10000000000);
    let time = Math.round(local.timestamp/1000);
    //let tempEvidence = 'placeholder';
    if (evidence.length > 0 && disputeReason != 0) {
      //console.log(itemId)
      await provider.enable();
      let arbitrationContract = new ethers.Contract(NFTicketsArbitration_abi.address, NFTicketsArbitration_abi.abi, signer);
      const arbitrationWithSigner = await arbitrationContract.connect(signer);
      let tx = await arbitrationWithSigner.lodgeDispute(itemId, lat, lon, time, disputeReason, evidence);
      //console.log(tx);
      setDisputeSubmitted(true);
      setEvidence('');
    } else {
      alert('No reason or evidence provided');
    }
  }

  const { price, name, image, tokenId, start, location, startFull, finish, description, nftContract, itemId, amount } = props;
  return (
    
    <View style={styles.marketItem}>
      <Modal visible={purchasedModal} animationType='slide' onRequestClose={() => closePurchasedModal()}>
        { /******************************************************* */
          // START OF DISPUTE MODAL
          /******************************************************* */}
        <Modal visible={disputeModal} animationType='slide' onRequestClose={() => closeDisputeModal()}>
          <ScrollView>
            <View style={styles.marketItemDetailsContainer}>
              <TouchableOpacity onPress={() => closeDisputeModal()}>
                <FontAwesome name="arrow-left" size={25} style={styles.backButton} />
              </TouchableOpacity>
              <View style={styles.disputeContainer}>
              <Text style={styles.heading}>Dispute for: {name}</Text>
              <Text style={styles.detailsItemText}>Please fill in the dispute details and submit evidence for evaluation.</Text>
              <Text style={styles.disoputeHeading}>Dispute reason:</Text>
              <View style={styles.pickerContainer}>
              <Picker
                style={styles.pickerTest}
                ref={pickerRef}
                selectedValue={disputeReason}
                onValueChange={(itemValue, itemIndex) =>
                  setDisputeReason(itemValue)
                }>
                <Picker.Item label="Select a reason" value={0} />
                <Picker.Item label="Event not organized" value={1} />
                <Picker.Item label="Event not as desribed" value={2} />
                <Picker.Item label="Event access denied" value={3} />
              </Picker>
              </View>
              <Text style={styles.disoputeHeading}>Dispute evidence:</Text>
              <View style={styles.evidenceSelection}>
                <TouchableOpacity style={styles.smallButton} onPress={pickImageLive}>
                  <FontAwesome name='camera' color={'white'} size={28} style={styles.btnImage} ></FontAwesome>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={pickImage}>
                <FontAwesome name='image' color={'white'} size={28} style={styles.btnImage} ></FontAwesome>
                </TouchableOpacity>
                
              </View>
                {evidencePreview && <Image source={{ uri: evidencePreview }} style={styles.evidenceImage} />}
                {disputeSubmitted ? (
                  <Text style={styles.purchaseMessage}>Dispute submitted!</Text> 
                ) : null}
              <View style={styles.ticketsInputArea}>
                <TouchableOpacity style={styles.disputeButton} onPress={() => lodgeDisputeFunction(itemId)}>
                  <Text style={styles.buyButtonText}>Lodge dispute</Text>
                </TouchableOpacity>
                
              </View> 
              </View>          
            </View>
          </ScrollView>
        </Modal>
        { /******************************************************* */
          // END OF DISPUTE MODAL
          /******************************************************* */}
      <ScrollView>
        <View style={styles.marketItemDetailsContainer}>
        <TouchableOpacity onPress={() => closePurchasedModal()}>
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
          <Text style={styles.detailsItemText}>Tickets: {amount}</Text>

          {showQR ? (
            <View style={styles.code}> 
            <QRCode value={ticketQR} size={windowWidth * 0.9}/>
            </View>
          ) : null}
          <TouchableOpacity style={styles.scanButton} onPress={() => tryNewAuth(tokenId)}>
            <Text style={styles.buyButtonText}>Show QR</Text>
          </TouchableOpacity>
          <View style={styles.ticketsInputArea}>
          <TextInput style={styles.ticketsInput} placeholder='1' keyboardType='numeric' onChangeText={(val) => setTickets(val)}/>
          <TouchableOpacity style={styles.addButton} onPress={() => reSellFunction(nftContract, tokenId, itemId, amount)}>
            <Text style={styles.buyButtonText}>Resell tickets</Text>
          </TouchableOpacity> 
          </View>
          {reselling ? (
            <Text style={styles.purchaseMessage}>Listing your ticket(s) on the market, please approve the transaction.</Text> 
          ) : null}
          {sold ? (
            <Text style={styles.purchaseMessage}>Listing complete.</Text> 
          ) : null}
          <Text style={styles.actionsHeading}>Lodge a dispute:</Text>
          <View style={styles.ticketsInputArea}>
          <TouchableOpacity style={styles.disputeButton} onPress={() => openDisputeModal(itemId)}>
            <Text style={styles.buyButtonText}>Lodge a dispute</Text>
          </TouchableOpacity>
          </View>           
          </View> 
        </View> 
        </ScrollView>     
      </Modal>
      <TouchableOpacity onPress={() => openPurchasedModal(tokenId)}>
      <Image source={{ uri: image }} style={styles.eventImage}/>
      <View style={styles.marketItemInfo}>
      <Text style={styles.itemHeading}>{name}</Text>
      <View style={styles.marketItemInfoBottom}>
        <View style={styles.marketItemInfoLeft}>
        <Text style={styles.itemText}>Location: {location}</Text>
        <Text style={styles.itemText}>Start: {startFull}</Text>
        <Text style={styles.itemText}>Finish: {finish}</Text>
        </View>
        <View style={styles.marketItemInfoRight}>
        <Text style={styles.itemText}>${price/100}</Text>
        <Text style={styles.itemText}>{amount} tickets bought</Text>
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
    paddingRight: windowWidth * 0.02,
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
  disputeButton: {
    width: windowWidth * 0.92,
    margin: windowWidth * 0.02,
    backgroundColor: '#dc0445',
    borderRadius: 8,
  },
  disputeDescriptionInput: {

    borderWidth: 1,
    borderColor: '#AFB1C1',
    padding: windowWidth * 0.02,
    margin: windowWidth * 0.02,
    width: windowWidth * 0.92,
    borderRadius: 8,
    fontSize: 16,
    height: windowHeight * 0.2,
  },
  disoputeHeading: {
    fontSize: 24,
    fontWeight: '400',
    color: '#254E70',
    paddingTop: windowHeight * 0.02,
    paddingLeft: windowWidth * 0.02,
    paddingBottom: windowHeight * 0.02,
  },
  disputeContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    marginLeft: windowWidth * 0.02,
  },
  evidenceSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: windowHeight * 0.02,
  },
  smallButton: {
    width: windowWidth * 0.45,
    marginLeft: windowWidth * 0.02,
    backgroundColor: '#254E70',
    borderRadius: 8,
  },
  evidenceImage: {
    width: windowWidth * 0.92,
    margin: windowWidth * 0.02,
    aspectRatio: 16 / 9,
    resizeMode: 'cover',
    borderRadius: 8,
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
  btnImage: {
    padding: windowWidth * 0.02,
    alignSelf: 'center',
  },
  pickerTest: {
    padding: windowWidth * 0.02,
  },
  pickerContainer: {
    borderColor: '#AFB1C1',
    borderWidth: 1,
    borderRadius: 8,
    margin: windowWidth * 0.02,
    width: windowWidth * 0.92,
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

export default PurchasedItem 