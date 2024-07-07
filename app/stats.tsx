import AsyncStorage from "@react-native-async-storage/async-storage";
import Bill from "./bill";
import { Float } from "react-native/Libraries/Types/CodegenTypes";

export async function saveStats(stats: Stats) {
    await AsyncStorage.setItem('stats', JSON.stringify(stats));
}

export default class Stats {
    totalFries: number;
    totalCurrywurst: number;
    totalBratwurst: number;
    totalSchaschlik: number;
    totalIncome: Float;
    

    constructor() {
        this.totalFries = 0;
        this.totalCurrywurst = 0;
        this.totalBratwurst = 0;
        this.totalSchaschlik = 0;
        this.totalIncome = 0;

        this.loadStats();
    }

    async loadStats() {
        const statsString = await AsyncStorage.getItem('stats');
        if (statsString) {
            console.log("loading: " + statsString);
            const stats = JSON.parse(statsString);
            this.totalFries = stats.totalFries;
            this.totalCurrywurst = stats.totalCurrywurst;
            this.totalBratwurst = stats.totalBratwurst;
            this.totalSchaschlik = stats.totalSchaschlik;
            this.totalIncome = stats.totalIncome;
        }
    }

    updateStats(bill: Bill) {
        this.totalFries += bill.getFries();
        this.totalCurrywurst += bill.getCurrywurst();
        this.totalBratwurst += bill.getBratwurst();
        this.totalSchaschlik += bill.getSchaschlik();
        this.totalIncome += bill.calculatePrice();

        saveStats(this);
    }

    reset() {
        this.totalFries = 0;
        this.totalCurrywurst = 0;
        this.totalBratwurst = 0;
        this.totalSchaschlik = 0;
        this.totalIncome = 0;

        saveStats(this);
    }
};