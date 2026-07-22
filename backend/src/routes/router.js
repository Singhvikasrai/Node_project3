import express from "express";
import upload from "../middleware/upload.js";

import {
    registerUserController,
    getUsersController,
    updateUserController,
    deleteUserController,
    loginUserController
} from "../controllers/userController.js";

import {
    AddressController,
    getAddressController,
    updateAddressController
} from "../controllers/addressController.js";

import {
    cityController,
    updateCityController
} from "../controllers/cityController.js";

import {
    statecontroller,
    updateStatecontroller
} from "../controllers/stateController.js";

import {
    employmentController,
    updateEmploymentController
} from "../controllers/empController.js";

import {
    emsalaryController,
    updatesalaryController
} from "../controllers/salaryController.js";

import {
    createController,
    getAuditController
} from "../controllers/auditController.js";

import {
    getPendingListController,
    getPendingByIdController,
    approvePendingController,
    rejectPendingController,
    savePendingController,
    getPendingEditStatusController
} from "../controllers/pendingController.js";


import authUser, { requireAdmin } from "../middleware/authUser.js";


const router = express.Router();


// ================= USER =================

router.post(
    "/register",
    upload.any(),
    registerUserController
);

router.post(
    "/login",
    loginUserController
);

router.get(
    "/users",
    authUser,
    getUsersController
);

router.put(
    "/users/:id",
    authUser,
    upload.single("profile_image"),
    updateUserController
);

router.delete(
    "/users/:id",
    authUser,
    deleteUserController
);


// ================= ADDRESS =================

router.post(
    "/address",
    upload.single("address_image"),
    AddressController
);

router.get(
    "/address/:userId",
    getAddressController
);

router.put(
    "/address/:id",
    upload.single("address_image"),
    updateAddressController
);


// ================= CITY =================

router.get(
    "/city",
    cityController
);

router.put(
    "/city/:id",
    updateCityController
);


// ================= STATE =================

router.get(
    "/state",
    statecontroller
);

router.put(
    "/state/:id",
    updateStatecontroller
);


// ================= EMPLOYMENT =================

router.post(
    "/employment",
    employmentController
);

router.put(
    "/employment/:id",
    updateEmploymentController
);


// ================= SALARY =================

router.post(
    "/salary",
    upload.single("salary_image"),
    emsalaryController
);

router.put(
    "/salary/:id",
    upload.single("salary_image"),
    updatesalaryController
);


// ================= AUDIT =================

router.get(
    "/audit",
    getAuditController
);

router.post(
    "/api/audit",
    createController
);


// ================= PENDING APPROVAL =================

// Admin pending list
router.get(
    "/pending",
    authUser,
    requireAdmin,
    getPendingListController
);


// A regular user can use this to lock the edit screen while their request is pending.
// It must be declared before /pending/:id so Express does not treat "edit-status" as an ID.
router.get(
    "/pending/edit-status",
    authUser,
    getPendingEditStatusController
);

// Admin pending detail
router.get(
    "/pending/:id",
    authUser,
    requireAdmin,
    getPendingByIdController
);


// Admin approve
router.put(
    "/pending/:id/approve",
    authUser,
    requireAdmin,
    approvePendingController
);


// Admin reject
router.put(
    "/pending/:id/reject",
    authUser,
    requireAdmin,
    rejectPendingController
);

// ================= SAVE USER UPDATE REQUEST =================

router.post(
    "/pending",
    authUser,
    upload.any(),
    savePendingController
);



export default router;
