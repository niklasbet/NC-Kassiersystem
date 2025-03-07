import { ThemedText } from '@/components/ThemedText';
import { Pressable, StyleSheet, View, ViewBase, Alert } from 'react-native';

import { ScrollView } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { useState } from 'react';
import { stats } from '../globals';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Dialog, PaperProvider, Portal } from 'react-native-paper';

export default function TabTwoScreen() {
  const [totalIncome, setTotalIncome] = useState(stats.totalIncome)
  const [totalFries, setTotalFries] = useState(stats.totalFries)
  const [totalBratwurst, setTotalBratwurst] = useState(stats.totalBratwurst)
  const [totalCurrywurst, setTotalCurrywurst] = useState(stats.totalCurrywurst)
  const [totalSchaschlik, setTotalSchaschlik] = useState(stats.totalSchaschlik)
  const [totalLahmacun, setTotalLahmacun] = useState(stats.totalLahmacun)
  const [totalSoldProducts, setTotalSoldProducts] = useState(stats.totalSoldProducts)
  const [dummy, setDummy] = useState(1)

  const [day1Button, setDay1Button] = useState(stats.day == 1 ? '#307B30' : '#007BFF')
  const [day2Button, setDay2Button] = useState(stats.day == 2 ? '#307B30' : '#007BFF')
  const [day3Button, setDay3Button] = useState(stats.day == 3 ? '#307B30' : '#007BFF')

  const [visible, setVisible] = useState(false);
  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

  const createTwoButtonAlert = () =>
    Alert.alert('Alert Title', 'My Alert Msg', [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      { text: 'OK', onPress: () => console.log('OK Pressed') },
    ]);

  const widthAndHeight = 200
  const series = [dummy, totalFries, totalBratwurst, totalCurrywurst, totalSchaschlik, totalLahmacun]
  const sliceColor = ['#303030', '#fbd203', '#ffb300', '#ff9100', '#ff6c00', '#ff3c00']

  const interval = setInterval(() => {
    if (stats.totalFries + stats.totalBratwurst + stats.totalCurrywurst + stats.totalSchaschlik + stats.totalLahmacun == 0) {
      setDummy(1);
    }

    setTotalFries(stats.totalFries);
    setTotalBratwurst(stats.totalBratwurst);
    setTotalCurrywurst(stats.totalCurrywurst);
    setTotalSchaschlik(stats.totalSchaschlik);
    setTotalLahmacun(stats.totalLahmacun);
    setTotalIncome(stats.totalIncome);
    setTotalSoldProducts(stats.totalSoldProducts);

    if (stats.totalFries + stats.totalBratwurst + stats.totalCurrywurst + stats.totalSchaschlik + stats.totalLahmacun > 0) {
      setDummy(0);
    }
  }, 2000);

  return (
    <PaperProvider>
      <View style={styles.wholeDisplay}>

        <View style={{ marginTop: 60, alignSelf: 'center', justifyContent: 'center', flexDirection: 'row', width: '100%' }}>
          <View style={styles.topButtonsView}>
            <Pressable style={{ alignSelf: 'center', alignItems: 'center', width: '70%', backgroundColor: day1Button, borderRadius: 5 }}
              onPress={async () => {
                setDay1Button('#307B30');
                setDay2Button('#007BFF');
                setDay3Button('#007BFF');
                await AsyncStorage.setItem('day', '1');
                stats.changeToDay();
              }}>
              <ThemedText>Tag 1</ThemedText>
            </Pressable>
          </View>
          <View style={styles.topButtonsView}>
            <Pressable style={{ alignSelf: 'center', alignItems: 'center', width: '70%', backgroundColor: day2Button, borderRadius: 5 }}
              onPress={async () => {
                setDay2Button('#307B30');
                setDay1Button('#007BFF');
                setDay3Button('#007BFF');
                await AsyncStorage.setItem('day', '2');
                stats.changeToDay();
              }}>
              <ThemedText>Tag 2</ThemedText>
            </Pressable>
          </View>
          <View style={styles.topButtonsView}>
            <Pressable style={{ alignSelf: 'center', alignItems: 'center', width: '70%', backgroundColor: day3Button, borderRadius: 5 }}
              onPress={async () => {
                setDay3Button('#307B30');
                setDay2Button('#007BFF');
                setDay1Button('#007BFF');
                await AsyncStorage.setItem('day', '3');
                stats.changeToDay();
              }}>
              <ThemedText>Tag 3</ThemedText>
            </Pressable>
          </View>
        </View>


        <ScrollView>
          <ThemedText type="title" style={{ marginTop: -30 }}></ThemedText>
          <ThemedText type="title" style={styles.titleContainer}>Totale Verkäufe</ThemedText>

          <View style={styles.vertical}>
            <View style={styles.halfDisplay}>
              <ThemedText type="subtitle" style={{ alignSelf: 'flex-end' }}>Total eingenommen:</ThemedText>
              <ThemedText type="subtitle" style={{ alignSelf: 'flex-end' }}>Pommes:</ThemedText>
              <ThemedText type="subtitle" style={{ alignSelf: 'flex-end' }}>Bratwurst:</ThemedText>
              <ThemedText type="subtitle" style={{ alignSelf: 'flex-end' }}>Currywurst:</ThemedText>
              <ThemedText type="subtitle" style={{ alignSelf: 'flex-end' }}>Schaschlik:</ThemedText>
              <ThemedText type="subtitle" style={{ alignSelf: 'flex-end' }}>Lahmacun:</ThemedText>
            </View>
            <View style={styles.halfDisplay}>
              <ThemedText type="subtitle" style={styles.middle}>{totalIncome}€</ThemedText>
              <ThemedText type="subtitle" style={styles.middle}>{totalFries}x</ThemedText>
              <ThemedText type="subtitle" style={styles.middle}>{totalBratwurst}x</ThemedText>
              <ThemedText type="subtitle" style={styles.middle}>{totalCurrywurst}x</ThemedText>
              <ThemedText type="subtitle" style={styles.middle}>{totalSchaschlik}x</ThemedText>
              <ThemedText type="subtitle" style={styles.middle}>{totalLahmacun}x</ThemedText>
            </View>
          </View>

          <ThemedText type="title" style={styles.titleContainer}>Verkaufsverteilung</ThemedText>
          <View style={styles.vertical2}>
            <PieChart style={styles.middle} widthAndHeight={widthAndHeight} series={series} sliceColor={sliceColor} />
            <View style={styles.middle}>
              <ThemedText style={{ color: sliceColor[1], marginLeft: 30 }}>Pommes {(totalFries * 100 / totalSoldProducts).toFixed(2)}%</ThemedText>
              <ThemedText style={{ color: sliceColor[2], marginLeft: 30 }}>Bratwurst {(totalBratwurst * 100 / totalSoldProducts).toFixed(2)}%</ThemedText>
              <ThemedText style={{ color: sliceColor[3], marginLeft: 30 }}>Currywurst {(totalCurrywurst * 100 / totalSoldProducts).toFixed(2)}%</ThemedText>
              <ThemedText style={{ color: sliceColor[4], marginLeft: 30 }}>Schaschlik {(totalSchaschlik * 100 / totalSoldProducts).toFixed(2)}%</ThemedText>
              <ThemedText style={{ color: sliceColor[5], marginLeft: 30 }}>Lahmacun {(totalLahmacun * 100 / totalSoldProducts).toFixed(2)}%</ThemedText>
            </View>
          </View>

          <Pressable style={styles.buttonRed}
            onLongPress={() => {
              createTwoButtonAlert
              showDialog();
              // stats.reset();
            }}>
            <ThemedText style={styles.middle}>Tag zurücksetzen</ThemedText>
          </Pressable>
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
              stats.reset();
              hideDialog();
            }}>Ja</Button>
            <Button onPress={hideDialog}>Nein</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  buttonRed: {
    backgroundColor: '#FF0000',
    alignSelf: 'center',
    justifyContent: 'center',
    width: '30%',
    height: '7%',
    borderRadius: 10,
    marginTop: 50,
    bottom: -150
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
