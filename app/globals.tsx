import { useState } from "react";
import Stats from "./stats";
import ProductList from "./productList";

export let stats = new Stats(1);
stats.changeToDay();

export let productList = new ProductList();


export let RED_COLOR = "#F44037";
export let BLUE_COLOR = "#788DDA";