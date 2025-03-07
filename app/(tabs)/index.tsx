import { Image, StyleSheet, View, Pressable } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ScrollView } from 'react-native';
import Bill from '../bill';
import { useState } from 'react';
import { stats } from '../globals';
import { Button, Dialog, PaperProvider, Portal } from 'react-native-paper';

let bill = new Bill();

export default function HomeScreen() {
  const [billText, setBillText] = useState(bill.toString());
  const [visible, setVisible] = useState(false);

  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

  return (
    <PaperProvider>
      <View style={{ backgroundColor: '#000000' }}>
        <ThemedText type="title" style={styles.titleContainer}>Kasse</ThemedText>

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
    height: '100%',
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
    backgroundColor: 'blue',
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
