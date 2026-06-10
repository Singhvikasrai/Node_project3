import express from "express";
import {
    registerUserController,
    getUsersController,
    updateUserController,deleteUserController, loginUserController,} from "../controllers/userController.js";

import {AddressController, getAddressController, updateAddressController} from "../controllers/addressController.js";
import {cityController, updateCityController} from "../controllers/cityController.js";
import { statecontroller, updateStatecontroller} from "../controllers/stateController.js";
import {employmentController, updateEmploymentController} from "../controllers/empController.js";
import  authUser  from "../middleware/authUser.js";
import { emsalaryController, updatesalaryController } from "../controllers/salaryController.js";


const router = express.Router();

router.post("/register", registerUserController);
router.get("/users", authUser, getUsersController);
router.put("/users/:id",authUser, updateUserController);
router.delete("/users/:id",authUser, deleteUserController);
router.post("/login", loginUserController);
router.post("/address", AddressController);
router.get("/address/:userId", getAddressController);
router.get("/city", cityController);
router.get("/state", statecontroller);
router.post("/employment", employmentController);
router.post("/salary", emsalaryController);
router.put("/city/:id", updateCityController);
router.put("/state/:id", updateStatecontroller);
router.put("/employment/:id", updateEmploymentController);
router.put("/salary/:id", updatesalaryController);
router.put("/address/:id", updateAddressController);


export default router;