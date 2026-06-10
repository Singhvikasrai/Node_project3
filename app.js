import express from "express";
import router from "./src/routes/router.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const port = process.env.PORT || 5000;

app.use(express.json());

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use("/", router);

app.listen(port, () => {

    console.log(`Server is running on port ${port}`);
});