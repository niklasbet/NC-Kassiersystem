import { Image, StyleSheet, Platform, View, Button, Pressable } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScrollView } from 'react-native';
import Bill from '../bill';
import { useState } from 'react';
import Stats from '../stats';

let bill = new Bill();
let stats = new Stats();

export default function HomeScreen() {
  const [billText, setBillText] = useState(bill.toString());

  return (
    <View>
      <ThemedText type="title" style={styles.titleContainer}>Explore</ThemedText>


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
              <ThemedText>Pommes</ThemedText>
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
              <ThemedText>Currywurst</ThemedText>
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
              <ThemedText>Schaschlik</ThemedText>
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
              <ThemedText>Bratwurst</ThemedText>
            </Pressable>
          </View>
        </ScrollView>

        <View style={styles.rightSide}>
          <ThemedText style={styles.titleTwoContainer}>
            Order
          </ThemedText>

          <ScrollView>
            <ThemedText>
              {billText}
            </ThemedText>

            <Pressable
              onLongPress={() => {
                stats.updateStats(bill);

                bill.reset();
                setBillText(bill.toString());
                console.log(stats);
              }}>
              <ThemedText style={styles.textBlue}>Add to Statistics</ThemedText>
            </Pressable>
            <ThemedText>
              {""}
            </ThemedText>
            <Pressable
              onLongPress={() => {
                bill.reset();
                setBillText(bill.toString());
                console.log("Delete");
              }}>
              <ThemedText style={styles.textRed}>Delete Bill</ThemedText>
            </Pressable>

            <ThemedText>
              {""}
            </ThemedText>
            <Pressable
              onLongPress={() => {
                stats.reset();
              }}>
              <ThemedText style={styles.textRed}>Delete Stats</ThemedText>
            </Pressable>
          </ScrollView>

        </View>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  wholeDisplay: {
    //backgroundColor: 'lightgray',
    height: '100%',
    width: '50%',
  },
  rightSide: {
    //backgroundColor: 'gray',
    height: '100%',
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
    shadowColor: 'white',
    shadowOffset: { width: -4, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  textBlue: {
    color: "#007BFF",
  },
  textRed: {
    color: "#FF0000",
  }
});
