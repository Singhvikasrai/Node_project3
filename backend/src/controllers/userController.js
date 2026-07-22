import {
    getUserByIdService,
    updateUserService,
    deleteUserService,
    loginUserService,
    registerUserWithDetailsService,
    getUsersWithPaginationService
} from "../services/userService.js";
import { createService } from "../services/auditService.js";
import jwt from "jsonwebtoken";
import { toPublicUploadPath } from "../config/paths.js";
import { savePendingUpdateService } from "../services/pendingService.js";
import { attachUploadedFiles } from "../utils/uploadPayload.js";

// ==========================================
// 1. REGISTER CONTROLLER
// ==========================================
export const registerUserController = async (req, res) => {
    try {
        if (!req.body || (typeof req.body === "object" && Object.keys(req.body).length === 0)) {
            return res.status(400).json({ success: false, message: "Request body is required" });
        }

        let data;
        if (req.body.data) {
            try {
                data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            } catch (err) {
                return res.status(400).json({ success: false, message: "Invalid JSON format in 'data' field" });
            }
        } else {
            data = {
                user: { ...req.body },
                addresses: [],
                employments: []
            };
        }

        // Attach files if any
        attachUploadedFiles(data, req.files);

        if (!data.user?.password) {
            return res.status(400).json({ success: false, message: "Password is required" });
        }

        const result = await registerUserWithDetailsService(data);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result
        });

    } catch (error) {
        console.error("REGISTER CONTROLLER ERROR:", error);

        if (error.code === "ER_DUP_ENTRY") {
            const field = error.sqlMessage?.includes("email")
                ? "Email"
                : error.sqlMessage?.includes("mobile")
                ? "Mobile number"
                : "Record";

            return res.status(409).json({
                success: false,
                message: `${field} already exists`
            });
        }

        return res.status(500).json({
            success: false,
            message: "Registration failed",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

// ==========================================
// 2. GET USERS CONTROLLER
// ==========================================
export const getUsersController = async (req, res) => {
    try {
        if (req.user?.role === "admin") {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 15));
            const offset = (page - 1) * limit;

            const { users, total } = await getUsersWithPaginationService(offset, limit);
            const totalPages = Math.ceil(total / limit);

            return res.status(200).json({
                success: true,
                message: "Users fetched successfully",
                data: {
                    users,
                    total,
                    totalPages,
                    page,
                    limit
                }
            });
        }

        // Non-admin logic (Single User Profile)
        const user = await getUserByIdService(req.user.id);

        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: {
                users: user ? [user] : [],
                total: user ? 1 : 0,
                totalPages: 1,
                page: 1,
                limit: 1
            }
        });

    } catch (error) {
        console.error("Get Users Controller Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching users"
        });
    }
};

// ==========================================
// 3. UPDATE USER CONTROLLER
// ==========================================
export const updateUserController = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: "A valid user ID is required" });
        }

        if (req.user.role !== "admin" && Number(req.user.id) !== userId) {
            return res.status(403).json({ success: false, message: "You can only update your own profile" });
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ success: false, message: "Request body is required" });
        }

        const normalizedImagePath = req.file ? toPublicUploadPath(req.file.path) : undefined;
        const payload = { ...req.body };

        if (normalizedImagePath !== undefined) {
            payload.profile_image = normalizedImagePath;
        }

        // Admin Direct Update vs Regular User Pending Request
        if (req.user.role === "admin") {
            const result = await updateUserService(userId, payload);

            await createService({
                user_id: req.user.id, // Audit entry admin context se honi chahiye
                primary_id: userId,
                primary_type: "user",
                data: payload
            });

            return res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: result
            });
        }

        // Non-admin Pending approval flow
        await savePendingUpdateService(userId, payload);

        return res.status(200).json({
            success: true,
            message: "Changes sent for admin approval."
        });

    } catch (error) {
        console.error("Update User Controller Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating user"
        });
    }
};

// ==========================================
// 4. DELETE USER CONTROLLER
// ==========================================
export const deleteUserController = async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin access is required" });
        }

        const userId = Number(req.params.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: "A valid user ID is required" });
        }

        const result = await deleteUserService(userId);

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: result
        });
    } catch (error) {
        console.error("Delete User Controller Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting user"
        });
    }
};

// ==========================================
// 5. LOGIN CONTROLLER
// ==========================================
export const loginUserController = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ success: false, message: "Request body is required" });
        }

        const user = await loginUserService(req.body);

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET environment variable missing.");
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            success: true,
            message: "Login Successfully",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Controller Error:", error.message);
        const message = error.message || "Login Error";

        if (message.toLowerCase().includes("invalid email or password")) {
            return res.status(401).json({ success: false, message });
        }

        if (
            message.toLowerCase().includes("pending admin approval") ||
            message.toLowerCase().includes("inactive") ||
            message.toLowerCase().includes("pending")
        ) {
            return res.status(403).json({ success: false, message });
        }

        return res.status(500).json({
            success: false,
            message: "Login Error"
        });
    }
};