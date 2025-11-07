import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Button, DataTable, DefaultTheme, Dialog, PaperProvider, Portal, TextInput } from "react-native-paper";
import { StyleSheet } from 'react-native';
import { useEffect, useState } from "react";
import { productList } from "./globals";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';



export default function buttonView() {
    // const [visible, setVisible] = useState(false);
    // const openMenu = () => setVisible(true);
    // const closeMenu = () => setVisible(false);

    const [nameText, setNameText] = useState("");
    const [priceText, setPriceText] = useState("");

    const [page, setPage] = useState<number>(0);
    const [numberOfItemsPerPageList] = useState([8, 10, 12]);
    const [itemsPerPage, onItemsPerPageChange] = useState(
        numberOfItemsPerPageList[0]
    );

    const [lockName, setLockName] = useState(false);
    const [visible, setVisible] = useState(false);
    const showDialog = () => setVisible(true);
    const hideDialog = () => setVisible(false);

    const from = page * itemsPerPage;
    const to = Math.min((page + 1) * itemsPerPage, productList.getAll().length);

    useEffect(() => {
        setPage(0);
    }, [itemsPerPage]);

    return (
        <PaperProvider>
            <View style={styles.wholeDisplay}>

                <View style={styles.vertical}>
                    <Button onPress={() => {
                        setLockName(false);
                        setNameText("");
                        setPriceText("");
                        showDialog();
                    }}
                        mode="contained-tonal"
                        style={{ marginHorizontal: 10, backgroundColor: "#788DC5" }}>
                        <ThemedText style={styles.Text}>Neu</ThemedText>
                    </Button>

                    {/* <Button onLongPress={() => {
                        productList.getAll().forEach(p => productList.removeProduct(p.getName()));
                        router.navigate("/buttonView");
                    }}
                    mode="contained-tonal"
                    style={{marginHorizontal: 10, backgroundColor: "#D44737"}}>
                        <ThemedText style={styles.Text}>Alle löschen</ThemedText>
                    </Button> */}
                </View>

                <DataTable>
                    <DataTable.Header theme={DarkTheme}>
                        <DataTable.Title>
                            <ThemedText style={styles.Text}>Name</ThemedText>
                        </DataTable.Title>
                        <DataTable.Title><ThemedText style={styles.Text}>Preis</ThemedText></DataTable.Title>
                        <DataTable.Title><ThemedText style={styles.Text}>Statistik</ThemedText></DataTable.Title>
                        <DataTable.Title numeric><ThemedText style={styles.Text}>Aktion</ThemedText></DataTable.Title>
                    </DataTable.Header>

                    {productList.getAll().slice(from, to).map((prod) => (
                        <Pressable onPress={() => {
                            setNameText(prod.name);
                            setLockName(true);
                            setPriceText(prod.price.toString());
                            showDialog();
                        }}>
                            <DataTable.Row key={prod.getId()}>
                                <DataTable.Cell><ThemedText style={styles.Text}>{prod.name}</ThemedText></DataTable.Cell>
                                <DataTable.Cell><ThemedText style={styles.Text}>{prod.price}</ThemedText></DataTable.Cell>
                                <DataTable.Cell>
                                    <Button onPress={() => {
                                        prod.stat = !prod.stat;
                                        productList.save();
                                        router.navigate("/buttonView");
                                    }}>
                                        <ThemedText style={styles.Text}>{prod.stat ? "Ja" : "Nein"}</ThemedText>
                                    </Button>
                                </DataTable.Cell>

                                <DataTable.Cell numeric style={{ alignItems: 'baseline' }}>
                                    <Button icon='trash-can-outline' mode="outlined" onLongPress={() => {
                                        productList.removeProduct(prod.getName());
                                        router.navigate("/buttonView");
                                    }}><ThemedText></ThemedText></Button>

                                    <Button icon='camera' mode="outlined" onLongPress={async () => {
                                        const pickImageAsync = async () => {
                                            let result = await ImagePicker.launchImageLibraryAsync({
                                                mediaTypes: ['images'],
                                                allowsEditing: true,
                                                quality: 1,
                                            });

                                            if (!result.canceled) {
                                                console.log(result);
                                                prod.setPicture(result.assets[0].uri);
                                                productList.save();
                                            } else {
                                                alert('You did not select any image.');
                                            }
                                        };
                                        pickImageAsync();
                                    }}><ThemedText></ThemedText></Button>
                                    {/* <ThemedText>hello</ThemedText> */}
                                </DataTable.Cell>
                            </DataTable.Row>
                        </Pressable>
                    ))}

                    <DataTable.Pagination
                        page={page}
                        numberOfPages={Math.ceil(productList.getAll().length / itemsPerPage)}
                        onPageChange={(page) => setPage(page)}
                        label={`${from + 1}-${to} of ${productList.getAll().length}`}
                        numberOfItemsPerPageList={numberOfItemsPerPageList}
                        numberOfItemsPerPage={itemsPerPage}
                        onItemsPerPageChange={onItemsPerPageChange}
                        showFastPaginationControls
                        selectPageDropdownLabel={'Rows per page'}
                    />
                </DataTable>
            </View>

            <Portal>
                <Dialog visible={visible} onDismiss={hideDialog}>
                    <Dialog.Title>{lockName ? "Preis ändern" : "Neues Produkt hinzufügen"}</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Name"
                            mode="outlined"
                            placeholder="Enter name"
                            disabled={lockName}
                            value={nameText}
                            onChangeText={text => setNameText(text)}
                        />
                        <TextInput
                            label="Price"
                            mode="outlined"
                            placeholder="0.00"
                            keyboardType="numeric"
                            right={<TextInput.Affix text="€" />}
                            value={priceText}
                            onChangeText={text => setPriceText(text)}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => {
                            productList.addProduct(nameText.trim(), parseFloat(priceText.replace(",", ".")));
                            hideDialog();
                            router.navigate("/buttonView");
                        }}>Speichern</Button>
                        <Button onPress={hideDialog}>Abbrechen</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </PaperProvider>
    );

}

const styles = StyleSheet.create({
    Text: {
        color: '#FFFFFF',
    },
    wholeDisplay: {
        backgroundColor: "#202020",
        height: '100%',
        width: '100%',
    },
    vertical: {
        flexDirection: 'row',
        //height: '100%',
        width: '100%',
        justifyContent: 'center',
        marginBottom: 20,
        marginTop: 20,
    },
});