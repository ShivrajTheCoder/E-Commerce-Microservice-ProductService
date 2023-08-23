import express from "express";
import { AddProduct, AddRating, BuyProducts, DeleteProduct, GetAllProducts, GetProduct, GetTrendingProducts, SearchProducts, UpdateProduct } from "../Controllers/productControllers";
import multer, { Multer } from "multer";

import { authenticateToken } from "../Utils/userAuthMiddleware";
import { authenticateAdminToken } from "../Utils/adminAuthMiddleware";
const router = express.Router();
const upload: Multer = multer({ dest: 'uploads/' });

router.route("/addproduct")
    .post(authenticateAdminToken,upload.single('img'), AddProduct)
    
router.route("/getallproducts")
    .get(GetAllProducts)

router.route("/product/:productId")
    .get(GetProduct)
    .put(authenticateAdminToken,UpdateProduct)
    .delete(authenticateAdminToken,DeleteProduct)

router.route("/rating/:productId")
    .put(authenticateToken,AddRating)

router.route("/treadingproducts")
    .get(GetTrendingProducts)
    
router.route("/products/buy")
    .post(authenticateToken,BuyProducts)
    
router.route("/search/:query")
    .get(SearchProducts)

export default router;