import { Image, StyleSheet, Platform, View, Button, Pressable } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScrollView } from 'react-native';
import Bill from '../bill';
import { useState } from 'react';
import { stats } from '../globals';

let bill = new Bill();

export default function HomeScreen() {
  const [billText, setBillText] = useState(bill.toString());

  return (
    <View>
      <ThemedText type="title" style={styles.titleContainer}>Kassieren</ThemedText>

      <View style={styles.vertical}>
        <ScrollView style={styles.wholeDisplay}>
          <View style={styles.horizontal}>
            <Pressable style={styles.button}
              onPress={() => {
                bill.addFries();
                setBillText(bill.toString());
              }}
              onLongPress={() => {
                bill.deleteFries();
                setBillText(bill.toString());
              }}>
              <Image
                style={styles.imageLikeButton}
                source={require('./../../assets/images/pommes.jpg')} />
              <ThemedText style={styles.textInImage}>{bill.fries_price}€</ThemedText>
            </Pressable>

            <Pressable style={styles.button}
              onPress={() => {
                bill.addCurrywurst();
                setBillText(bill.toString());
              }}
              onLongPress={() => {
                bill.deleteCurrywurst();
                setBillText(bill.toString());
              }}>
              <Image
                style={styles.imageLikeButton}
                source={require('./../../assets/images/currywurst.jpg')} />
              <ThemedText style={styles.textInImage}>{bill.currywurst_price}€</ThemedText>
            </Pressable>
          </View>

          <View style={styles.horizontal}>
            <Pressable style={styles.button}
              onPress={() => {
                bill.addSchaschlik();
                setBillText(bill.toString());
              }}
              onLongPress={() => {
                bill.deleteSchaschlik();
                setBillText(bill.toString());
              }}>
              <Image
                style={styles.imageLikeButton}
                source={require('./../../assets/images/schaschlik.jpg')} />
              <ThemedText style={styles.textInImage}>{bill.schaschlik_price}€</ThemedText>
            </Pressable>

            <Pressable style={styles.button}
              onPress={() => {
                bill.addBratwurst();
                setBillText(bill.toString());
              }}
              onLongPress={() => {
                bill.deleteBratwurst();
                setBillText(bill.toString());
              }}>
              <Image
                style={styles.imageLikeButton}
                source={require('./../../assets/images/bratwurst.jpg')} />
              <ThemedText style={styles.textInImage}>{bill.bratwurst_price}€</ThemedText>
            </Pressable>
          </View>


          <View style={styles.horizontal}>
            <Pressable style={styles.button}
              onPress={() => {
                bill.addLahmacun();
                setBillText(bill.toString());
              }}
              onLongPress={() => {
                bill.deleteLahmacun();
                setBillText(bill.toString());
              }}>
              <Image
                style={styles.imageLikeButton}
                source={require('./../../assets/images/lahmacun.jpg')} />
              <ThemedText style={styles.textInImage}>{bill.lahmacun_price}€</ThemedText>
            </Pressable>
          </View>
        </ScrollView>


        <View style={styles.rightSide}>
          <ThemedText style={styles.titleTwoContainer}>
            Total
          </ThemedText>


          <ScrollView style={styles.billBackground}>
            <ThemedText></ThemedText>
            <ThemedText style={{ left: 15 }}>
              {billText}
            </ThemedText>
          </ScrollView>


          <View style={{ position: 'relative', bottom: -10, backgroundColor: 'black' }}>
            <Pressable style={styles.buttonBlue}
              onPress={() => {
                stats.updateStats(bill);

                bill.reset();
                setBillText(bill.toString());
                console.log(stats);
              }}>
              <ThemedText style={styles.middle}>Finish</ThemedText>
            </Pressable>
            <ThemedText>
              {""}
            </ThemedText>
            <Pressable style={styles.buttonRed}
              onLongPress={() => {
                bill.reset();
                setBillText(bill.toString());
                console.log("Delete");
              }}>
              <ThemedText style={styles.middle}>Delete</ThemedText>
            </Pressable>

            <ThemedText>
              {""}
            </ThemedText>
            
          </View>

        </View>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  middle: {
    alignSelf: 'center',
    marginVertical: 'auto',
  },
  wholeDisplay: {
    //backgroundColor: 'lightgray',
    height: '100%',
    width: '50%',
  },
  rightSide: {
    //backgroundColor: 'gray',
    height: '75%',
    width: '40%',
  },
  titleContainer: {
    marginTop: 60,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
  },
  titleTwoContainer: {
    marginTop: 30,
    marginBottom: 10,
    fontWeight: 'bold',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  vertical: {
    flexDirection: 'row',
    //justifyContent: 'center',
    height: '100%',
    width: '100%',
    //backgroundColor: 'gray',
  },
  button: {
    padding: 15,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
    width: '40%',
    height: 100,
    marginBottom: 10,
    backgroundColor: "#007BFF",
    //shadowColor: 'white',
    //shadowOffset: { width: -4, height: 3 },
    //shadowOpacity: 0.3,
    //shadowRadius: 3,
  },
  imageLikeButton: {
    width: '160%',
    height: '160%',
    //resizeMode: 'contain',
    borderRadius: 20,
  },
  textInImage: {
    position: 'absolute',
    color: '#000000',
    bottom: 0,
    right: 0,
    fontSize: 25,
    fontWeight: 'bold',
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    //shadowColor: '#FFFFFF',
    //shadowOffset: { width: 0, height: 0 },
    //shadowOpacity: 1,
    //shadowRadius: 3,
    paddingTop: 1,
    height: 20,
    //width: 60,
    borderRadius: 5,
    borderColor: '#FF0000',
    //borderWidth: 1,
  },
  textBlue: {
    color: "#007BFF",
  },
  textRed: {
    color: "#FF0000",
  },
  billBackground: {
    backgroundColor: '#303030',
    height: 10,
    borderRadius: 10
    //width: '100%',
  },
  buttonRed: {
    backgroundColor: '#FF0000',
    alignSelf: 'center',
    //justifyContent: 'center',
    width: '70%',
    height: '20%',
    borderRadius: 10,
    marginTop: 10,
  },
  buttonBlue: {
    backgroundColor: '#007BFF',
    alignSelf: 'center',
    width: '70%',
    height: '20%',
    borderRadius: 10,
    marginBottom: 10,
  }
});
