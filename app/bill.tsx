import { Float } from "react-native/Libraries/Types/CodegenTypes";

export default class Bill {
    fries: number;
    currywurst: number;
    schaschlik: number;
    bratwurst: number;

    fries_price: Float;
    currywurst_price: Float;
    bratwurst_price: Float;
    schaschlik_price: Float;

    constructor() {
        this.fries = 0;
        this.fries_price = 1.5;

        this.currywurst = 0;
        this.currywurst_price = 2.5;

        this.schaschlik = 0;
        this.schaschlik_price = 1;

        this.bratwurst = 0;
        this.bratwurst_price = 2;
    }

    addFries() {
        this.fries++;
    }
    getFries(): number {
        return this.fries;
    }
    deleteFries() {
        if(this.fries > 0) {
            this.fries--;
        }
    }

    addCurrywurst() {
        this.currywurst++;
    }
    getCurrywurst(): number {
        return this.currywurst;
    }
    deleteCurrywurst() {
        if(this.currywurst > 0) {
            this.currywurst--;
        }
    }

    addSchaschlik() {
        this.schaschlik++;
    }
    getSchaschlik(): number {
        return this.schaschlik;
    }
    deleteSchaschlik() {
        if(this.schaschlik > 0) {
            this.schaschlik--;
        }
    }

    addBratwurst() {
        this.bratwurst++;
    }
    getBratwurst(): number {
        return this.bratwurst;
    }
    deleteBratwurst() {
        if(this.bratwurst > 0) {
            this.bratwurst--;
        }
    }

    calculatePrice() : Float {
        var price = 0;
        price += this.fries * this.fries_price;
        price += this.currywurst * this.currywurst_price;
        price += this.schaschlik * this.schaschlik_price;
        price += this.bratwurst * this.bratwurst_price;

        return price;
    }

    reset() {
        this.fries = 0;
        this.currywurst = 0;
        this.schaschlik = 0;
        this.bratwurst = 0;
    }

    toString() : string {
        let str = "";

        str += this.fries > 0 ? this.fries + "x Fries " + this.fries_price + "€\n" : "";
        str += this.currywurst > 0 ? this.currywurst + "x Currywurst " + this.currywurst_price + "€\n" : "";
        str += this.schaschlik > 0 ? this.schaschlik + "x Schaschlik " + this.schaschlik_price + "€\n" : "";
        str += this.bratwurst > 0 ? this.bratwurst + "x Bratwurst " + this.bratwurst_price + "€\n\n" : "";

        str += "Total: " + this.calculatePrice() + "€\n";

        return str;
    }
};