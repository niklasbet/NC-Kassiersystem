import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Button, DataTable, Dialog, PaperProvider, Portal, TextInput } from "react-native-paper";
import { StyleSheet } from 'react-native';
import { useEffect, useState } from "react";
import { productList } from "./globals";


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

                <Button onPress={() => {
                    setLockName(false);
                    setNameText("");
                    setPriceText("");
                    showDialog();
                }}>
                    <ThemedText>Neu</ThemedText>
                </Button>

                <Button onLongPress={() => {
                    productList.getAll().forEach(p => productList.removeProduct(p.getName()));
                    router.navigate("/buttonView");
                }}>
                    <ThemedText>Delete All</ThemedText>
                </Button>

                <DataTable>
                    <DataTable.Header>
                        <DataTable.Title>Name</DataTable.Title>
                        <DataTable.Title>Price</DataTable.Title>
                        <DataTable.Title numeric>Aktion</DataTable.Title>
                    </DataTable.Header>

                    {productList.getAll().slice(from, to).map((prod) => (
                        <Pressable onPress={() => {
                            setNameText(prod.name);
                            setLockName(true);
                            setPriceText(prod.price.toString());
                            showDialog();
                        }}>
                            <DataTable.Row key={prod.getId()}>
                                <DataTable.Cell>{prod.name}</DataTable.Cell>
                                <DataTable.Cell>{prod.price}</DataTable.Cell>

                                <DataTable.Cell numeric style={{ alignItems: 'baseline' }}>
                                    <Button icon='trash-can-outline' mode="outlined" onLongPress={() => {
                                        productList.removeProduct(prod.getName());
                                        router.navigate("/buttonView");
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
    wholeDisplay: {
        backgroundColor: "#202020",
        height: '100%',
        width: '100%',
    },
});