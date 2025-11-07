import { Float } from "react-native/Libraries/Types/CodegenTypes";



export default class Product {
    name: string;
    price: Float;
    id: number;
    picture: string;
    stat: boolean;
    
    constructor(name: string, price: Float, id: number) {
        this.name = name;
        this.price = price;
        this.id = id;
        this.picture = '';
        this.stat = true;
    }

    setPicture(picture: string) {
        this.picture = picture;
    }

    getPicture(): string {
        return this.picture;
    }

    setName(name: string) {
        this.name = name;
    }
    
    getName(): string {
        return this.name;
    }

    setPrice(price: Float) {
        this.price = price;
    }
    
    getPrice(): Float {
        return this.price;
    }

    setId(id: number) {
        this.id = id;
    }

    getId(): number {
        return this.id;
    }

    tostring(): string {
        return `Product: ${this.name}, Price: ${this.price}`;
    }

    equals(product: Product): boolean {
        return this.name === product.getName() && this.id === product.getId();
    }
};