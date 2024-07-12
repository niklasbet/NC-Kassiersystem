import AsyncStorage from "@react-native-async-storage/async-storage";
import Bill from "./bill";
import { Float } from "react-native/Libraries/Types/CodegenTypes";

export async function saveStats(stats: Stats) {
    let str = 'stats' + stats.day;
    await AsyncStorage.setItem(str, JSON.stringify(stats));
}

export default class Stats {
    totalFries: number;
    totalCurrywurst: number;
    totalBratwurst: number;
    totalSchaschlik: number;
    totalLahmacun: number;
    totalIncome: Float;
    totalSoldProducts: number;
    day: number;

    constructor(day: number) {
        this.totalFries = 0;
        this.totalCurrywurst = 0;
        this.totalBratwurst = 0;
        this.totalSchaschlik = 0;
        this.totalLahmacun = 0;
        this.totalIncome = 0;
        this.totalSoldProducts = 0;
        this.day = day;

        this.loadStats();
    }

    async changeToDay(){
        let str = await AsyncStorage.getItem('day');
        if (str)
            this.day = parseInt(str, 10);
            console.log(this.day);

        this.loadStats();
    }

    async loadStats() {
        let str = "stats" + this.day;
        const statsString = await AsyncStorage.getItem(str);
        if (statsString) {
            console.log("loading: " + statsString);
            const stats = JSON.parse(statsString);
            this.totalFries = stats.totalFries;
            this.totalCurrywurst = stats.totalCurrywurst;
            this.totalBratwurst = stats.totalBratwurst;
            this.totalSchaschlik = stats.totalSchaschlik;
            this.totalLahmacun = stats.totalLahmacun;
            this.totalIncome = stats.totalIncome;
            this.totalSoldProducts = stats.totalSoldProducts;
        } else {
            this.totalFries = 0;
            this.totalCurrywurst = 0;
            this.totalBratwurst = 0;
            this.totalSchaschlik = 0;
            this.totalLahmacun = 0;
            this.totalIncome = 0;
            this.totalSoldProducts = 0;
        }
    }

    updateStats(bill: Bill) {
        this.totalFries += bill.getFries();
        this.totalCurrywurst += bill.getCurrywurst();
        this.totalBratwurst += bill.getBratwurst();
        this.totalSchaschlik += bill.getSchaschlik();
        this.totalLahmacun += bill.getLahmacun();
        this.totalIncome += bill.calculatePrice();
        this.totalSoldProducts = this.totalFries + this.totalCurrywurst + this.totalSchaschlik + this.totalLahmacun + this.totalBratwurst;

        saveStats(this);
    }

    reset() {
        this.totalFries = 0;
        this.totalCurrywurst = 0;
        this.totalBratwurst = 0;
        this.totalSchaschlik = 0;
        this.totalLahmacun = 0;
        this.totalIncome = 0;
        this.totalSoldProducts = 0;

        saveStats(this);
    }
};