import AsyncStorage from "@react-native-async-storage/async-storage";
import Product from "./product";

export async function saveProductList(productList: ProductList) {
    let str = 'productList';
    // console.log("saving:" + JSON.stringify(productList));
    await AsyncStorage.setItem(str, JSON.stringify(productList));
}

export default class ProductList {
    products: Product[] = [];
    id_index: number = 0;

    constructor() {
        this.loadProductList();
    }

    addProduct(name: string, price: number, image: string = '', stat: boolean = true) {
        if (name === "" || isNaN(price))
            return;

        if (this.products.find(p => p.name === name)) {
            this.products.forEach(p => {
                if (p.name === name)
                    p.price = price;
            });
            return;
        }

        let p = new Product(name, price, this.id_index);
        p.setPicture(image);
        p.stat = stat;
        this.products.push(p);
        this.id_index++;
        this.save();
    }

    removeProduct(name: string) {
        this.products = this.products.filter(p => p.name !== name);
        this.save();
    }

    getProduct(name: string) {
        return this.products.find(p => p.name === name);
    }

    getAll() {
        return this.products;
    }

    setPrice(name: string, price: number) {
        this.products.forEach(p => {
            if (p.name === name) {
                p.price = price;
            }
        });
    }

    getPrice(name: string) {
        let tmpPrice = this.products.find(p => p.name === name)?.price;
        return tmpPrice !== undefined ? tmpPrice : 0;
    }

    save() {
        saveProductList(this);
    }

    toString() {
        return JSON.stringify(this.products);
    }

    async loadProductList() {
        const productListString = await AsyncStorage.getItem('productList');
        if (productListString) {
            const productList = JSON.parse(productListString).products;

            for (const product of productList) {
                this.addProduct(product.name, product.price, product.picture, product.stat);

            }

            // console.log("loading:" + this.toString());
        } else {
            console.log("No product list found.");
            this.products = [];
        }
    }
};