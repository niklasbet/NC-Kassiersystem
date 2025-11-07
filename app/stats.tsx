import AsyncStorage from "@react-native-async-storage/async-storage";
import Bill from "./bill";
import { Float } from "react-native/Libraries/Types/CodegenTypes";
import { cloneElement } from "react";
import { productList } from "./globals";

export async function saveStats(stats: Stats) {
    let str = 'stats' + stats.day;
    await AsyncStorage.setItem(str, JSON.stringify(stats));
}

export default class Stats {
    bills: Bill[] = [];
    day: number;
    id_index: number = 0;

    constructor(day: number) {
        this.day = day;

        this.bills = [];

        this.loadStats();
    }

    async changeToDay() {
        let str = await AsyncStorage.getItem('day');
        if (str)
            this.day = parseInt(str, 10);
        // console.log(this.day);

        this.loadStats();
    }

    async loadStats() {
        let str = "stats" + this.day;
        const statsString = await AsyncStorage.getItem(str);
        if (statsString) {
            // console.log("loading: " + statsString);
            const stats = JSON.parse(statsString);
            this.day = stats.day;

            this.bills = stats.bills;
            // console.log("🚀 ~ Stats ~ loadStats ~ this.bills:", this.bills)
            // for (const tmpBill of billList) {
            //     this.bills.push(new Bill(tmpBill.name, tmpBill.price));
            // }

        } else {
            this.bills = [];
        }
    }

    deleteBill(bill: Bill) {
        if (this.bills == undefined)
            this.bills = []

        this.bills = this.bills.filter((b) => {
            return b != bill;
        })
    }

    updateStats(bill: Bill) {
        let tmpBill = new Bill(this.id_index);
        this.id_index++;

        let isFilled = false;
        for (let prodName in bill.products) {
            let amount = bill.products[prodName];
            let product = productList.getProduct(prodName);

            if (product === undefined)
                continue;

            tmpBill.addProduct(product, amount);
            isFilled = true;
        }

        if (!isFilled)
            return;

        tmpBill.datetime = new Date().toLocaleString();
        tmpBill.calculatePrice();
        // console.log("🚀 ~ Stats ~ updateStats ~ tmpBill:", tmpBill)
        if (this.bills == undefined)
            this.bills = [];
        this.bills.push(tmpBill);
        // console.log("🚀 ~ Stats ~ updateStats ~ bills:", this.bills)
        saveStats(this);
    }

    getTotal() {
        if (this.bills == undefined)
            this.bills = []

        let total: Float = 0;
        this.bills.forEach((bill) => {
            for (let name in bill.products) {
                let amount = bill.products[name];
                // Use `key` and `value`

                let tmpProd = productList.getProduct(name);
                if (tmpProd === undefined)
                    continue;

                total += tmpProd.getPrice() * amount;
            }
        });

        return total;
    }

    getTotalAmount() {
        if (this.bills == undefined)
            this.bills = []

        let total: number = 0;
        this.bills.forEach((bill) => {
            for (let name in bill.products) {
                let p = productList.getProduct(name);
                if (p && p.stat) {
                    let amount = bill.products[name];
                    // Use `key` and `value`

                    total += amount;
                }
            }
        });

        return total;
    }


    getProductAmount(name: string) {
        let total: number = 0;

        if (this.bills == undefined)
            this.bills = []

        this.bills.forEach((bill) => {
            if (isNaN(bill.products[name]))
                return;
            total += bill.products[name];
        });

        return total;
    }

    getTotalFromProduct(name: string) {
        if (this.bills == undefined)
            this.bills = []

        let total: Float = 0;

        this.bills.forEach((bill) => {
            if (isNaN(bill.products[name]))
                return;
            total += bill.products[name] * productList.getPrice(name);
            // total += productList.getPrice(name);
        });

        return total;
    }

    reset() {
        this.bills = [];

        saveStats(this);
    }
};