import { ThemedText } from '@/components/ThemedText';
import { Pressable, StyleSheet, View, ViewBase, Alert } from 'react-native';

import { ScrollView } from 'react-native';
import PieChart from 'react-native-pie-chart';
import React, { useEffect, useState } from 'react';
import { BLUE_COLOR, productList, RED_COLOR, stats } from '../globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Dialog, PaperProvider, Portal } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';

export default function TabTwoScreen() {
  const [dummy, setDummy] = useState(1)

  const [day1Button, setDay1Button] = useState(stats.day == 1 ? BLUE_COLOR : '#404040')
  const [day2Button, setDay2Button] = useState(stats.day == 2 ? BLUE_COLOR : '#404040')
  const [day3Button, setDay3Button] = useState(stats.day == 3 ? BLUE_COLOR : '#404040')

  const [visible, setVisible] = useState(false);
  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

  const widthAndHeight = 200
  let series = [dummy]
  productList.getAll().forEach(product => {
    if (product.stat) {
      series.push(stats.getProductAmount(product.getName()));
    }
  });

  const sliceColorDatabase = ['#303030', '#ec7063', '#a569bd', '#5dade2', '#45b39d', '#58d68d', '#f5b041', '#dc7633', '#922b21', '#76448a', '#1f618d', '#148f77', '#1e8449', '#b7950b', '#af601a'];
  const sliceColor: string[] = []
  series.forEach((value, index) => {
    sliceColor.push(sliceColorDatabase[index % sliceColorDatabase.length])
  });

  const updatePage = () => {
    setTimeout(() => {
      // console.log("update!");
      if (stats.getTotal() == 0) {
        setDummy(1)
      } else {
        setDummy(0)
      }

      router.navigate('/explore');
    }, 50);
    return;
  };

  useFocusEffect(
    React.useCallback(() => {
      updatePage();
      // Do something when the screen is focused
      return () => {
        setDummy(1)
        // Do something when the screen is unfocused
        // Useful for cleanup functions
      };
    }, [])
  );

  // useEffect(() => {
  //   updatePage();
  // }, [day1Button, day2Button, day3Button]);

  return (
    <PaperProvider>
      <View style={styles.wholeDisplay}>

        <View style={{ marginTop: 60, alignSelf: 'center', justifyContent: 'center', flexDirection: 'row', width: '100%' }}>
          <View style={styles.topButtonsView}>
            <Pressable style={{ alignSelf: 'center', alignItems: 'center', width: '70%', backgroundColor: day1Button, borderRadius: 5 }}
              onPress={async () => {
                setDay1Button(BLUE_COLOR);
                setDay2Button('#404040');
                setDay3Button('#404040');
                await AsyncStorage.setItem('day', '1');
                stats.changeToDay();
                updatePage();
              }}>
              <ThemedText>Tag 1</ThemedText>
            </Pressable>
          </View>
          <View style={styles.topButtonsView}>
            <Pressable style={{ alignSelf: 'center', alignItems: 'center', width: '70%', backgroundColor: day2Button, borderRadius: 5 }}
              onPress={async () => {
                setDay2Button(BLUE_COLOR);
                setDay1Button('#404040');
                setDay3Button('#404040');
                await AsyncStorage.setItem('day', '2');
                stats.changeToDay();
                updatePage();
              }}>
              <ThemedText>Tag 2</ThemedText>
            </Pressable>
          </View>
          <View style={styles.topButtonsView}>
            <Pressable style={{ alignSelf: 'center', alignItems: 'center', width: '70%', backgroundColor: day3Button, borderRadius: 5 }}
              onPress={async () => {
                setDay3Button(BLUE_COLOR);
                setDay2Button('#404040');
                setDay1Button('#404040');
                await AsyncStorage.setItem('day', '3');
                stats.changeToDay();
                updatePage();
              }}>
              <ThemedText>Tag 3</ThemedText>
            </Pressable>
          </View>
        </View>


        <ScrollView style={{ height: '110%' }}>
          <ThemedText type="title" style={{ marginTop: -30 }}></ThemedText>
          <ThemedText type="title" style={styles.titleContainer}>Totale Verkäufe</ThemedText>

          <View style={styles.vertical}>
            <View style={styles.halfDisplay}>
              <ThemedText type="subtitle" style={{ alignSelf: 'flex-end' }}>Total eingenommen:</ThemedText>
              {productList.getAll().map(product => {
                return <ThemedText type="subtitle" style={{ alignSelf: 'flex-end' }}>{product.getName()}:</ThemedText>
              })}
            </View>
            <View style={styles.halfDisplay}>
              <ThemedText type="subtitle" style={styles.middle}>{stats.getTotal()}€</ThemedText>
              {productList.getAll().map(product => {
                return <ThemedText type="subtitle" style={styles.middle}>{stats.getProductAmount(product.getName())}</ThemedText>
              })}
            </View>
          </View>

          <ThemedText type="title" style={styles.titleContainer}>Verkaufsverteilung</ThemedText>
          <View style={styles.vertical2}>
            <PieChart style={styles.middle} widthAndHeight={widthAndHeight} series={series} sliceColor={sliceColor} />
            <View style={styles.middle}>
              {productList.getAll().map((product, index) => {
                return product.stat ? <ThemedText style={{ color: sliceColor[index + 1], marginLeft: 30 }}>{product.getName()} {(stats.getProductAmount(product.getName()) * 100 / stats.getTotalAmount()).toFixed(2)}%</ThemedText> : null;
              })}
            </View>
          </View>

          <View style={{ alignSelf: 'center', justifyContent: 'center', flexDirection: 'row', width: '100%', height: '10%', marginTop: 50 }}>
            <View style={{ height: '100%', marginVertical: 'auto' }}>
              <Pressable style={styles.otherButtons}
                onPress={() => {
                  router.navigate('/buttonView');
                }}>
                <ThemedText style={styles.bottomButtons}>Produkte</ThemedText>
              </Pressable>
            </View>

            <View style={{ marginLeft: 50 }}>
              <Pressable style={styles.otherButtons}
                onPress={() => {
                  router.navigate('/historyView');
                }}>
                <ThemedText style={styles.bottomButtons}>Bestellverlauf</ThemedText>
              </Pressable>
            </View>
            <View style={{ height: '100%', marginVertical: 'auto', marginLeft: 65 }}>
              <Pressable style={styles.buttonRed}
                onLongPress={() => {
                  showDialog();
                  // stats.reset();
                }}>
                <ThemedText style={styles.bottomButtons}>Tag zurücksetzen</ThemedText>
              </Pressable>
            </View>
          </View>

          <ThemedText>{'\n\n\n\n'}</ThemedText>

        </ScrollView>

      </View >

      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog}>
          <Dialog.Title>Warnung</Dialog.Title>
          <Dialog.Content>
            <ThemedText>Wirklich löschen?</ThemedText>
            <ThemedText>Die Statistik kann danach nicht mehr wiederhergestellt werden!</ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setDummy(1);
              stats.reset();
              hideDialog();
              updatePage();
            }}>Ja</Button>
            <Button onPress={hideDialog}>Nein</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </PaperProvider >
  );
}

const styles = StyleSheet.create({
  buttonRed: {
    backgroundColor: RED_COLOR,
    // alignSelf: 'center',
    justifyContent: 'center',
    // width: '30%',
    // height: '7%',
    borderRadius: 10,
    height: '50%',
    width: '140%',
    // marginTop: 50,
    // bottom: -150
  },
  otherButtons: {
    backgroundColor: '#404040',
    justifyContent: 'center',
    borderRadius: 10,
    height: '50%',
    width: '140%',
  },
  bottomButtons: {
    //height: '100%',
    alignSelf: 'center',
    //top: '25%',
  },
  topButtonsView: {
    alignSelf: 'center',
    //alignContent: 'center',
    alignItems: 'center',
    width: '20%',
    //backgroundColor: 'gray',
  },
  topButtons: {
    alignSelf: 'center',
    alignItems: 'center',
    width: '70%',
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  middle: {
    //justifyContent: 'center',
    //alignItems: 'center',
    alignSelf: 'center',
  },
  wholeDisplay: {
    backgroundColor: '#202020',
    height: '100%',
    width: '100%',
  },
  halfDisplay: {
    //backgroundColor: 'lightgray',
    //height: '100%',
    width: '50%',
  },
  rightSide: {
    //backgroundColor: 'gray',
    height: '100%',
    width: '40%',
  },
  titleContainer: {
    marginTop: 50,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 3,
  },
  titleTwoContainer: {
    marginTop: 30,
    marginBottom: 20,
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
    marginHorizontal: 5,
    flexDirection: 'row',
    //justifyContent: 'center',
    //height: '100%',
    width: '100%',
    //backgroundColor: 'gray',
  },
  vertical2: {
    // marginHorizontal: 120,
    flexDirection: 'row',
    justifyContent: 'center',
    //height: '100%',
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
    shadowColor: 'white',
    shadowOffset: { width: -4, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  imageLikeButton: {
    width: '160%',
    height: '160%',
    //resizeMode: 'contain',
    borderRadius: 25,
  },
  textInImage: {
    position: 'absolute',
    color: '#000000',
    bottom: 0,
    right: 0,
    fontSize: 25,
    fontWeight: 'bold',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  textBlue: {
    color: "#007BFF",
  },
  textRed: {
    color: "#FF0000",
  }
});
