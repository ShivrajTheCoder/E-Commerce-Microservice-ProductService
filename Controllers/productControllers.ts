import { Request, Response } from "express";
import { Product } from "../Models/productModels";
import { ProductDocument } from "../Models/productModels";
import { UploadImage } from "../Utils/uploadImage";
import { sendMessageToQueue } from "../sendProudctToOrder";
import { listenForMessages } from "../listenForMessages";
import fs from "fs";
interface AddProductRequestBody {
    name: string;
    description: string;
    price: string;
    img: File;
}
export const GetAllProducts = async (req: Request, res: Response) => {
    // console.log(req.query);
    const { page = 1, limit = 8 } = req.query;
    // console.log(Number(page), Number(limit),"after converting to number");
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = (Number(page)) * Number(limit);
    await Product.countDocuments()
        .then(async count => {
            if (count > 0) {
                await Product.find().limit(Number(limit)).skip(startIndex).then((result) => {
                    const response = {
                        data: result,
                        pagination: {
                            current: Number(page),
                            total: Math.ceil(count / Number(limit)),
                            next: null as any,
                            previous: null as any,
                        }
                    };
                    if (endIndex < count) {
                        response.pagination.next = {
                            page: Number(page) + 1,
                            limit: Number(limit),
                        };
                    }

                    if (startIndex > 0) {
                        response.pagination.previous = {
                            page: Number(page) - 1,
                            limit: Number(limit),
                        };
                    }
                    return res.status(200).json(response);
                })
            }
            else {
                return res.status(404).json({
                    message: "No products found"
                })
            }
            return;
        })
        .catch(err => {
            return res.status(500).json({
                message: "Something went wrong!",
                error: err
            })
        })


}


export const GetProduct = async (req: Request, res: Response) => {
    const { productId } = req.params;
    // console.log(productId);
    await Product.findById(productId)
        .then(result => {
            if (result) {
                return res.status(200).json({
                    product: result,
                    message: "Product found",
                })
            }
            else {
                return res.status(404).json({
                    message: "No product found"
                })
            }
        })
        .catch(error => {
            return res.status(500).json({
                error,
                message: "Something went wrong!!"
            })
        })
}

export const UpdateProduct = async (req: Request, res: Response) => {
    const { productId } = req.params;
    await Product.findByIdAndUpdate(productId, req.body, { new: true })
        .then(result => {
            if (result) {
                return res.status(200).json({
                    result,
                    message: "Successfully updated!"
                })
            }
            else {
                return res.status(404).json({
                    message: "No product found"
                })
            }
        })
        .catch(error => {
            return res.status(500).json({
                message: "Something went wrong!",
                error
            })
        })
}

export const DeleteProduct = async (req: Request, res: Response) => {
    const { productId } = req.params;
    await Product.findByIdAndDelete(productId)
        .then(result => {
            if (result) {
                return res.status(200).json({
                    result,
                    message: "Successfully removed",
                })
            }
            else {
                return res.status(404).json({
                    message: "Prouduct not found"
                })
            }
        })
        .catch(error => {
            return res.status(500).json({
                error,
                message: "Something went wrong!"
            })
        })
}

export const AddRating = async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { userRating } = req.body;
    await Product.findById(productId)
        .then(async (prod) => {
            if (prod) {
                const { rating, ratingCount } = prod;
                // console.log(rating,ratingCount);
                const newRatingCount = ratingCount + 1;
                // const newRating = (((rating*ratingCount) + userRating) / newRatingCount);
                const n1 = Number(rating) * Number(ratingCount);
                const n2 = n1 + Number(userRating);
                const n3 = n2 / newRatingCount;
                // console.log(n1,n2,n3);
                await Product.findByIdAndUpdate(productId, {
                    rating: n3,
                    ratingCount: newRatingCount
                }, { new: true })
                    .then(result => {
                        return res.status(200).json({
                            result,
                            messgage: "Rating added;"
                        })
                    })
                    .catch(error => {
                        return res.status(500).json({
                            error,
                            message: "Something went wrong!",
                        })
                    })
            }
            else {
                return res.status(404).json({
                    message: "Product not found"
                })
            }
            return;
        })
        .catch(error => {
            return res.status(500).json({
                error,
                message: "Something went wrong!",
            })
        })
}

export const BuyProducts = async (req: Request, res: Response) => {
    const { prod, userId } = req.body;
    const products: any[] = [];
    let errorFlag = false;

    try {
        for (const product of prod) {
            const { _id, qty } = product;
            try {
                const foundProd = await Product.findById(_id);
                if (foundProd) {
                    products.push({ ...foundProd.toJSON(), qty });
                }
            } catch (err) {
                errorFlag = true;
                break;
            }
        }

        if (errorFlag) {
            return res.status(500).json({
                message: "Something went wrong!",
            });
        }
        await sendMessageToQueue("order", JSON.stringify({
            products,
            userId,
        }));

        const result = await listenForMessages("product", (content: any) => {
            console.log(content, "received from order");
        });

        if (result === true) {
            return res.status(200).json({
                message: "Order placed",
            });
        } else {
            return res.status(500).json({
                message: "Something went wrong!",
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong!",
        });
    }
};

export const AddProduct = async (req: Request<{}, AddProductRequestBody>, res: Response) => {

    const { name, description, price } = req.body;
    // console.log(name, description, price);
    if (!req.file) {
        return res.status(404).json("Image not found");
    }
    const result = await UploadImage(req.file.path, name);
    // console.log(uploaded);
    if (result === "false") {
        return res.status(500).json({
            message: "Something went wrong !"
        })
    }
    else {
        // req.file.buffer = undefined;
        fs.unlinkSync(req.file.path);
        const product: ProductDocument = new Product({
            name, description, price, image_url: result
        })
        console.log(product);
        await product.save()
            .then((product) => {
                return res.status(201).json({
                    product,
                    message: "Product added",
                })
            })
            .catch(err => {
                console.log(err);
                return res.status(500).json({
                    message: "Something went wrong!",
                    error: err
                })
            })
    }
    return;
}

export const GetTrendingProducts = async (req: Request, res: Response) => {
    const { number } = req.query;
    // console.log(number);
    try {
        const products = await Product.find()
            .sort({ numberSold: -1 })
            .limit(Number(number))

        return res.status(200).json({
            message: "Trending Products",
            treanding: products,
        })
    }
    catch (error) {
        return res.status(500).json({
            error,
            message: "Something went wrong!",
        })
    }


}
export const SearchProducts = async (req: Request, res: Response) => {
    const { query } = req.params;
  
    try {
      let products;
  
      if (query) {
        products = await Product.find({
          name: { $regex: new RegExp(query, "i") }
        }).select("name _id");
      } else {
        products = await Product.find();
      }
  
      return res.status(200).json({
        products,
        message: "Products found"
      });
    } catch (error) {
      return res.status(500).json({
        message: "Something went wrong!",
        error
      });
    }
  };
  