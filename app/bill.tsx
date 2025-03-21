import { Float } from "react-native/Libraries/Types/CodegenTypes";
import Product from "./product";
import { productList } from "./globals";

export default class Bill {
    products: {[name: string]: number} = {};
    id: number;
    datetime: string = "";
    total: Float = 0;

    constructor(id:number) {
        this.products = {};
        this.id = id;
    }

    calculatePrice(): Float {
        var price : Float = 0;

        for (let name in this.products) {
            let amount = this.products[name];
            // Use `key` and `value`

            let tmpProd = productList.getProduct(name);
            if (tmpProd === undefined)
                continue;

            price += tmpProd.getPrice() * amount;
        }

        this.total = price;
        return price;
    }

    addProduct(product: Product, amount: number) {
        if (isNaN(this.products[product.getName()])) {
            this.products[product.getName()] = 0;
        }

        if (this.products[product.getName()] + amount < 0) {
            this.products[product.getName()] = 0;
            return;
        }

        this.products[product.getName()] += amount;
    }

    reset() {
        this.products = {};
    }

    toString(): string {
        let str = "";

        for (let name in this.products) {
            let amount = this.products[name];
            // Use `key` and `value`

            str += amount > 0  ? amount + "x " + name + " " + productList.getProduct(name)?.getPrice() + "€\n" : "";
        }

        if (this.calculatePrice() > 0) {
            str += "Total: " + this.total + "€\n";
        }

        return str;
    }
};