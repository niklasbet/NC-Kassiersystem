import { ThemedText } from "@/components/ThemedText";
import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { DataTable, Divider, PaperProvider } from "react-native-paper";
import { productList, stats } from "./globals";
import { router, useFocusEffect } from "expo-router";
import Bill from "./bill";
import { Float } from "react-native/Libraries/Types/CodegenTypes";
import { Pressable } from "react-native";


export default function historyView() {

    const [page, setPage] = useState<number>(0);
    const [numberOfItemsPerPageList] = useState([2, 4, 6, 8, 10, 12]);
    const [itemsPerPage, onItemsPerPageChange] = useState(
        numberOfItemsPerPageList[2]
    );

    const [keyId, setKeyId] = useState(0);

    const from = page * itemsPerPage;
    const to = Math.min((page + 1) * itemsPerPage, stats.bills.length);

    const updateTable = () => {
        let tmpRows: React.JSX.Element[] = [];
        stats.bills.slice(from, to).forEach((bill) => (
            tmpRows.push(
                <View>
                    <View style={styles.horizontal}>
                        <View style={{ margin: 'auto' }}>
                            <ThemedText>{bill.datetime.replace(', ', '\n')}</ThemedText>
                        </View>
                        <View style={{ margin: 'auto' }}>
                            <ThemedText>{billToString(bill)}</ThemedText>
                        </View>
                        <View style={{ margin: 'auto' }}>
                            <Pressable
                                onLongPress={() => {
                                    stats.deleteBill(bill);
                                    updateTable();
                                }}>
                                <ThemedText>Löschen</ThemedText>
                            </Pressable>
                        </View>
                    </View>
                    <Divider />
                </View>
            )));

        setDataTableRows(tmpRows);
    };

    useEffect(() => {
        // console.log("historyView update on itemPerPage");
        setPage(0);

        updateTable();
    }, [itemsPerPage]);

    useEffect(() => {
        // console.log("historyView update on page");

        updateTable();
    }, [page]);

    const [dataTableRows, setDataTableRows] = useState([] as React.JSX.Element[]);

    const billToString = (bill: Bill) => {
        let str = "";
        let price: Float = 0;
        for (let name in bill.products) {
            let amount = bill.products[name];
            // Use `key` and `value`

            // let tmpProd = productList.getProduct(name);
            // if (tmpProd === undefined)
            //     continue;

            // price += tmpProd.getPrice() * amount;

            str += amount > 0 ? amount + "x " + name + "\n": "";// + " " + productList.getProduct(name)?.getPrice() + "€\n" : "";
            // str += ;
        }

        str += "Total: " + bill.total + "€\n";

        return str;
    }

    useFocusEffect(
        useCallback(() => {
            // console.log("historyView update on focus");

            updateTable();

            router.navigate('/historyView');
            // Do something when the screen is focused
            return () => {
                // Do something when the screen is unfocused
                // Useful for cleanup functions
            };
        }, [])
    );

    return (
        <PaperProvider>
            <View style={styles.wholeDisplay}>
                <ScrollView>


                    {dataTableRows}

                </ScrollView>
                <DataTable>
                    <DataTable.Pagination
                        page={page}
                        numberOfPages={Math.ceil(stats.bills.length / itemsPerPage)}
                        onPageChange={(page) => setPage(page)}
                        label={`${from + 1}-${to} of ${stats.bills.length}`}
                        numberOfItemsPerPageList={numberOfItemsPerPageList}
                        numberOfItemsPerPage={itemsPerPage}
                        onItemsPerPageChange={onItemsPerPageChange}
                        showFastPaginationControls
                        selectPageDropdownLabel={'Rows per page'}
                    />
                </DataTable>
            </View>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    wholeDisplay: {
        backgroundColor: "#202020",
        height: '100%',
        width: '100%',
    },
    horizontal: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
    },
});