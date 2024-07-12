import { Float } from "react-native/Libraries/Types/CodegenTypes";

export default class Bill {
    fries: number;
    currywurst: number;
    schaschlik: number;
    bratwurst: number;
    lahmacun: number;

    fries_price: Float;
    currywurst_price: Float;
    bratwurst_price: Float;
    schaschlik_price: Float;
    lahmacun_price: Float;

    constructor() {
        this.fries = 0;
        this.fries_price = 2;

        this.currywurst = 0;
        this.currywurst_price = 2.5;

        this.schaschlik = 0;
        this.schaschlik_price = 3.5;

        this.bratwurst = 0;
        this.bratwurst_price = 2;

        this.lahmacun = 0;
        this.lahmacun_price = 3;
    }

    addFries() {
        this.fries++;
    }
    getFries(): number {
        return this.fries;
    }
    deleteFries() {
        if (this.fries > 0) {
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
        if (this.currywurst > 0) {
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
        if (this.schaschlik > 0) {
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
        if (this.bratwurst > 0) {
            this.bratwurst--;
        }
    }

    addLahmacun() {
        this.lahmacun++;
    }
    getLahmacun(): number {
        return this.lahmacun;
    }
    deleteLahmacun() {
        if (this.lahmacun > 0) {
            this.lahmacun--;
        }
    }

    calculatePrice(): Float {
        var price = 0;
        price += this.fries * this.fries_price;
        price += this.currywurst * this.currywurst_price;
        price += this.schaschlik * this.schaschlik_price;
        price += this.bratwurst * this.bratwurst_price;
        price += this.lahmacun * this.lahmacun_price;

        return price;
    }

    reset() {
        this.fries = 0;
        this.currywurst = 0;
        this.schaschlik = 0;
        this.bratwurst = 0;
        this.lahmacun = 0;
    }

    toString(): string {
        let str = "";

        str += this.fries > 0 ? this.fries + "x Fries " + this.fries_price + "€\n" : "";
        str += this.currywurst > 0 ? this.currywurst + "x Currywurst " + this.currywurst_price + "€\n" : "";
        str += this.schaschlik > 0 ? this.schaschlik + "x Schaschlik " + this.schaschlik_price + "€\n" : "";
        str += this.bratwurst > 0 ? this.bratwurst + "x Bratwurst " + this.bratwurst_price + "€\n" : "";
        str += this.lahmacun > 0 ? this.lahmacun + "x Lahmacun " + this.lahmacun_price + "€\n\n" : "";

        if (this.calculatePrice() > 0) {
            str += "Total: " + this.calculatePrice() + "€\n";
        }

        return str;
    }
};