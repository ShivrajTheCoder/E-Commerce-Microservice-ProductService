import express from "express";
import dotenv from "dotenv";
import productRoutes from "./Routes/productRoutes";
import { connectToDatabase } from "./db_connection";
import cors from "cors";
dotenv.config();
const app=express();
type Env={
    port:string;
}
const PORT=process.env["PORT" as keyof Env];
(async () => {
    await connectToDatabase().then(()=>{

        console.log('Connected to the database successfully!');
    })
    .catch(err=>{
        console.log(err);
    })
  })();
app.use(cors());
app.use(express.json());
app.use("/products",productRoutes)

app.listen(PORT,()=>{
    console.log(`product service running on ${PORT}`)
})