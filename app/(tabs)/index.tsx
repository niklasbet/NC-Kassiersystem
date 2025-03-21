import { Image, StyleSheet, View, Pressable } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ScrollView } from 'react-native';
import Bill from '../bill';
import { useState } from 'react';
import { productList, stats } from '../globals';
import { Button, Dialog, PaperProvider, Portal } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import React from 'react';

let bill = new Bill(0);

export default function HomeScreen() {
  const [billText, setBillText] = useState(bill.toString());
  const [visible, setVisible] = useState(false);

  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

  const [buttonInView, setButtonInView] = useState([] as React.JSX.Element[]);


  const updateButtonFrontEnd = () => {
    // console.log("updateButtonFrontEnd");
    let buttons = [];

    for (let i = 0; i < productList.getAll().length; i += 2) {
      let image1: React.JSX.Element[] = [];

      if (productList.getAll().length >= i + 2) {
        for (let j = 0; j < 2; j++) {
          var req = require("./../../assets/images/adaptive-icon.png");
          if (productList.getAll()[i + j].name.toLowerCase() == 'pommes') {
            req = require("./../../assets/images/pommes.jpg");
          } else if (productList.getAll()[i + j].name.toLowerCase() == 'schaschlik') {
            req = require("./../../assets/images/schaschlik.jpg");
          } else if (productList.getAll()[i + j].name.toLowerCase() == 'bratwurst') {
            req = require("./../../assets/images/bratwurst.jpg");
          } else if (productList.getAll()[i + j].name.toLowerCase() == 'currywurst') {
            req = require("./../../assets/images/currywurst.jpg");
          } else if (productList.getAll()[i + j].name.toLowerCase() == 'lahmacun') {
            req = require("./../../assets/images/lahmacun.jpg");
          }

          image1.push(<Image
            style={styles.imageLikeButton}
            source={req} />)
        }

        buttons.push(
          <View style={styles.horizontal}>
            <Pressable style={styles.button}
              onPress={() => {
                bill.addProduct(productList.getAll()[i], 1);
                setBillText(bill.toString());
              }}
              onLongPress={() => {
                bill.addProduct(productList.getAll()[i], -1);
                setBillText(bill.toString());
              }}>
              {image1.at(0)}
              <ThemedText style={styles.nameInImage}>{productList.getAll()[i].name}</ThemedText>
              <ThemedText style={styles.textInImage}>{productList.getAll()[i].price}€</ThemedText>
            </Pressable>

            <Pressable style={styles.button}
              onPress={() => {
                bill.addProduct(productList.getAll()[i + 1], 1);
                setBillText(bill.toString());
              }}
              onLongPress={() => {
                bill.addProduct(productList.getAll()[i + 1], -1);
                setBillText(bill.toString());
              }}>
              {image1.at(1)}
              <ThemedText style={styles.nameInImage}>{productList.getAll()[i + 1].name}</ThemedText>
              <ThemedText style={styles.textInImage}>{productList.getAll()[i + 1].price}€</ThemedText>
            </Pressable>
          </View>
        );
      } else {
        var req = require("./../../assets/images/adaptive-icon.png");
        if (productList.getAll()[i].name.toLowerCase() == 'pommes') {
          req = require("./../../assets/images/pommes.jpg");
        } else if (productList.getAll()[i].name.toLowerCase() == 'schaschlik') {
          req = require("./../../assets/images/schaschlik.jpg");
        } else if (productList.getAll()[i].name.toLowerCase() == 'bratwurst') {
          req = require("./../../assets/images/bratwurst.jpg");
        } else if (productList.getAll()[i].name.toLowerCase() == 'currywurst') {
          req = require("./../../assets/images/currywurst.jpg");
        } else if (productList.getAll()[i].name.toLowerCase() == 'lahmacun') {
          req = require("./../../assets/images/lahmacun.jpg");
        }

        image1.push(<Image
          style={styles.imageLikeButton}
          source={req} />)

        buttons.push(
          <View style={styles.horizontal}>
            <Pressable style={styles.button}
              onPress={() => {
                bill.addProduct(productList.getAll()[i], 1);
                setBillText(bill.toString());
              }}
              onLongPress={() => {
                bill.addProduct(productList.getAll()[i], -1);
                setBillText(bill.toString());
              }}>
              {image1.at(0)}
              <ThemedText style={styles.nameInImage}>{productList.getAll()[i].name}</ThemedText>
              <ThemedText style={styles.textInImage}>{productList.getAll()[i].price}€</ThemedText>
            </Pressable>
          </View>
        );
      }

    }
    setButtonInView(buttons);
  };

  useFocusEffect(
    React.useCallback(() => {
      updateButtonFrontEnd();
      // Do something when the screen is focused
      return () => {
        // Do something when the screen is unfocused
        // Useful for cleanup functions
      };
    }, [])
  );

  return (
    <PaperProvider>
      <View style={{ backgroundColor: '#000000' }}>
        <ThemedText type="title" style={styles.titleContainer}>Kasse</ThemedText>
        <View style={styles.vertical}>
          <ScrollView style={styles.wholeDisplay}>

            {buttonInView}


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
                  // console.log(stats);
                }}>
                <ThemedText style={styles.middle}>Fertig</ThemedText>
              </Pressable>
              {/* <ThemedText>
              {""}
            </ThemedText> */}
              <Pressable style={styles.buttonRed}
                onLongPress={() => {
                  showDialog();
                  console.log("Delete");
                }}>
                <ThemedText style={styles.middle}>Löschen</ThemedText>
              </Pressable>

              <Pressable
                onLongPress={() => {
                  router.navigate('/buttonView');
                }}>
                <ThemedText style={styles.middle}>Buttons</ThemedText>
              </Pressable>

              <ThemedText>
                {""}
              </ThemedText>

            </View>

          </View>

        </View>

        <Portal>
          <Dialog visible={visible} onDismiss={hideDialog}>
            <Dialog.Title>Warnung</Dialog.Title>
            <Dialog.Content>
              <ThemedText>Wirklich löschen?</ThemedText>
              <ThemedText>Die Bestellung wird nicht in die Statistik aufgenommen.</ThemedText>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => {
                bill.reset();
                setBillText(bill.toString());
                hideDialog();
              }}>Ja</Button>
              <Button onPress={hideDialog}>Nein</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  middle: {
    alignSelf: 'center',
    marginVertical: 'auto',
  },
  wholeDisplay: {
    marginTop: 70,
    // backgroundColor: 'lightgray',
    height: '60%',
    width: '50%',
  },
  rightSide: {
    //backgroundColor: 'gray',
    height: '75%',
    width: '40%',
    marginRight: 5,
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
    marginTop: 80,
    marginBottom: -20,
    fontWeight: 'bold',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    alignContent: 'center',
    textAlign: 'center',
    textAlignVertical: 'center',
    gap: 8,
    zIndex: 5,
    backgroundColor: '#202020',
    borderRadius: 10,
    width: '100%',
    height: '5%',
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
    // backgroundColor: 'gray',
  },
  button: {
    padding: 15,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 30,
    width: '40%',
    height: 120,
    marginBottom: 10,
    backgroundColor: '#202020',
    //shadowColor: 'white',
    //shadowOffset: { width: -4, height: 3 },
    //shadowOpacity: 0.3,
    //shadowRadius: 3,
  },
  imageLikeButton: {
    width: '130%',
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
  nameInImage: {
    position: 'relative',
    color: '#000000',
    bottom: 80,
    right: 'auto',
    // fontSize: 25,
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
    borderRadius: 10,
    // marginRight: 5,
    marginTop: 0,
    marginBottom: 8,
    //width: '100%',
  },
  buttonRed: {
    backgroundColor: '#e03434',//'#cc4545',
    alignSelf: 'center',
    //justifyContent: 'center',
    width: '70%',
    height: '20%',
    borderRadius: 10,
    marginTop: 10,
  },
  buttonBlue: {
    backgroundColor: '#1f8bde',
    alignSelf: 'center',
    width: '70%',
    height: '20%',
    borderRadius: 10,
    marginBottom: 10,
  }
});
