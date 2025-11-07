import { Image, StyleSheet, View, Pressable, ImageSourcePropType } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ScrollView } from 'react-native';
import Bill from '../bill';
import { useState } from 'react';
import { BLUE_COLOR, productList, RED_COLOR, stats } from '../globals';
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

  type Props = {
    imgSource: ImageSourcePropType;
  };

  const updateButtonFrontEnd = () => {
    // console.log("updateButtonFrontEnd");
    let buttons = [];

    for (let i = 0; i < productList.getAll().length; i += 2) {
      let image1: React.JSX.Element[] = [];

      if (productList.getAll().length >= i + 2) {
        for (let j = 0; j < 2; j++) {

          const req = productList.getAll()[i + j].getPicture() ? {uri: productList.getAll()[i + j].getPicture()} : require("./../../assets/images/adaptive-icon.png");

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

        const req = productList.getAll()[i].getPicture() ? {uri: productList.getAll()[i].getPicture()} : require("./../../assets/images/adaptive-icon.png");
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
      productList.loadProductList();
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

          <ThemedText style={{ position: 'absolute', left: 20, top: '66%', fontSize: 12 }}>
            Hinweis:
            {"\n"}
            'Fertig' fügt die Bestellung in die Statistiken ein.
            {"\n"}
            'Löschen' nimmt die Bestellung nicht in die Statistik auf.
            {"\n"}
            Bitte auf den ausgewählten Tag in den Statistiken achten.
            {"\n"}
            Lange auf ein Produkt drücken entfernt eins aus der Bestellung.
          </ThemedText>


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


            <View style={{ position: 'relative', bottom: -30, backgroundColor: 'black' }}>
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

              <Pressable style={styles.buttonsbutton}
                onPress={() => {
                  router.navigate('/buttonView');
                }}>
                <ThemedText style={styles.middle}>Produkte</ThemedText>
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
    height: '90%',
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
    justifyContent: 'center',
    // width: '50%',
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
    height: 100,
    //bottom: -50,
    borderRadius: 10,
    // marginRight: 5,
    marginTop: 0,
    marginBottom: 8,
    //width: '100%',
  },
  buttonRed: {
    backgroundColor: RED_COLOR,//'#cc4545',
    alignSelf: 'center',
    //justifyContent: 'center',
    width: '70%',
    height: '15%',
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  buttonBlue: {
    backgroundColor: BLUE_COLOR,
    alignSelf: 'center',
    width: '70%',
    height: '15%',
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonsbutton: {
    backgroundColor: '#404040',
    alignSelf: 'center',
    width: '70%',
    height: '10%',
    borderRadius: 10,
    marginBottom: 10,
    marginTop: 30,
    bottom: -30,
  }
});
