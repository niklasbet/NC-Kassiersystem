import { Image, StyleSheet, Platform, View, Button, Pressable } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <View>
      <ThemedText type="title" style={styles.titleContainer}>Explore</ThemedText>


      <ScrollView style={styles.wholeDisplay}>
        <View style={styles.horizontal}>
          <Pressable style={styles.button}>
            <ThemedText>Press me</ThemedText>
          </Pressable>

          <Pressable style={styles.button}>
            <ThemedText>Press me</ThemedText>
          </Pressable>
        </View>

        <View style={styles.horizontal}>
          <Pressable style={styles.button}>
            <ThemedText>Press me</ThemedText>
          </Pressable>

          <Pressable style={styles.button}>
            <ThemedText>Press me</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wholeDisplay: {
    //backgroundColor: 'gray',
    height: '100%',
  },
  titleContainer: {
    marginTop: 50,
    marginBottom: 50,
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
  button: {
    padding: 15,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
    width: '40%',
    height: 100,
    marginBottom: 10,
    backgroundColor: "#007BFF",
  },
});
