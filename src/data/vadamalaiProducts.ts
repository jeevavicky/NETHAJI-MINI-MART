import { Product, Category } from "../types";
import rawProducts from "./vadamalaiProducts.json";
import rawCategories from "./vadamalaiCategories.json";

export const VADAMALAI_CATEGORIES: Category[] = rawCategories as Category[];
export const VADAMALAI_PRODUCTS: Product[] = rawProducts as Product[];
