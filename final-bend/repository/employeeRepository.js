import mongoose from "mongoose";

export const connectDB= async()=>{
    try {
        await mongoose.connect(process.env.CONNECTION_STRING);
        console.log("MongoDB Connect");
    } catch (error) {
        console.log(error);
        process.exit();
    }
}