import express from "express";
import router from "./src/routes/router.js";
import cors from "cors";
import "dotenv/config";
import { uploadsDirectory } from "./src/config/paths.js";
import { errorHandler, notFoundHandler } from "./src/middleware/errorHandler.js";

const app = express();

const port = process.env.PORT || 5000;
app.use("/uploads", express.static(uploadsDirectory));
// Parse JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

// Log request metadata only; request bodies can contain passwords and personal data.
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use("/", router);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {

    console.log(`Server is running on port ${port}`);
});
