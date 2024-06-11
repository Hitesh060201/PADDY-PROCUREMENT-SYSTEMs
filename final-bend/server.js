import express from "express";
import {router as userRouter} from "./controller/userController.js"
import { connectDB } from "./repository/employeeRepository.js";
import "dotenv/config.js"
import cors from "cors";


const app=express();
connectDB();

app.use(cors());//cross origin resource sharing
app.use(express.json());

app.use("/api/v1/user",userRouter);

app.listen(5500);