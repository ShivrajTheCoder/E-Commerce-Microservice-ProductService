import mongoose, { Document, Schema } from "mongoose";

export interface IProduct{
    name:string;
    price:number;
    description:string;
    rating:number;
    ratingCount:number;
    image_url:string;
}

export type ProductDocument= IProduct & Document;
const productSchema:Schema=new Schema({
    name:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    description:{
        type:String,
        required:true,
        minLenght:30,
    },
    rating:{
        type:Number,
        default:0
    },
    ratingCount:{
        type:Number,
        default:0
    },
    image_url:{
        type:String,
        required:true,
    },
    numberSold:{
        type:String,
    },
    discount:{
        type:Number,
        default:5,
    }
})

export const Product=mongoose.model<IProduct>("Product",productSchema);