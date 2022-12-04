import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';

import Colors from '../constants/Colors';
import { MonoText } from './StyledText';
import { Text, View } from './Themed';

const SampleEvent = [{name: "Event 1", price: 0.99, image: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Daisy_pollen_flower_220533.jpg', amount: 5}];
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

export default function Event({ path }: { path: string }) {
  return (
    <View>
      <View style={styles.eventContainer}>
        <Text
          style={styles.getStartedText}
          lightColor="rgba(0,0,0,0.8)"
          darkColor="rgba(255,255,255,0.8)">
          Open up the code for this screen:
        </Text>
        <Text
          style={styles.getStartedText}
          lightColor="rgba(0,0,0,0.8)"
          darkColor="rgba(255,255,255,0.8)">
          {SampleEvent[0].name}
        </Text>
        <Image source={{ uri: "https://i.imgur.com/TkIrScD.png" }} style={styles.eventImage} />
        <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Daisy_pollen_flower_220533.jpg' }} style={styles.eventImage}/>

        <View
          style={[styles.codeHighlightContainer, styles.homeScreenFilename]}
          darkColor="rgba(255,255,255,0.05)"
          lightColor="rgba(0,0,0,0.05)">
          <MonoText>{path}</MonoText>
        </View>

        <Text
          style={styles.getStartedText}
          lightColor="rgba(0,0,0,0.8)"
          darkColor="rgba(255,255,255,0.8)">
          Change any of the text, save the file, and your app will automatically update.
        </Text>
      </View>

      <View style={styles.helpContainer}>
        <TouchableOpacity onPress={handleHelpPress} style={styles.helpLink}>
          <Text style={styles.helpLinkText} lightColor={Colors.light.tint}>
            Tap here if your app doesn't automatically update after making changes
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function handleHelpPress() {
  WebBrowser.openBrowserAsync(
    'https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet'
  );
}

const styles = StyleSheet.create({
  eventContainer: {
    backgroundColor: "red",
    borderRadius: 8,
    width: windowWidth * 0.96,
  },
  eventImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    resizeMode: 'cover',
    margin: 10,
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



