import {
    registerUser,
    registerUserWithDetails,
    getUsers,
    countUsers,
    getUserProfileImage,
    getUserById,
    updateUser,
    deleteUser,
    loginUser
} from "../models/userModel.js";

import bcrypt from "bcryptjs";

// ================= REGISTER =================
export const registerUserService = async (data) => {

    if (!data) {
        throw new Error("No data provided");
    }

    const {
        name,
        mobile,
        pincode,
        email,
        password,
        status,
        profile_image = null
    } = data;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return await registerUser({
        name,
        mobile,
        pincode,
        email,
        password: hashedPassword,
        status,
        profile_image
    });
};

export const registerUserWithDetailsService = async ({ user, addresses = [], employments = [] }) => {
    if (!user?.password) throw new Error("Password is required");
    const hashedPassword = await bcrypt.hash(user.password, 10);
    return registerUserWithDetails({
        user: { ...user, password: hashedPassword },
        addresses,
        employments
    });
};

// ================= GET ALL USERS =================
export const getUsersService = async (offset, limit) => {
    return await getUsers(offset, limit);
};

export const getUsersWithPaginationService = async (offset, limit) => {
    const [users, total] = await Promise.all([
        getUsers(offset, limit),
        countUsers()
    ]);
    return { users, total };
};

// ================= GET USER =================
export const getUserByIdService = async (id) => {
    return await getUserById(id);
};

// ================= UPDATE USER =================
export const updateUserService = async (id, data) => {

    const existingProfileImage = await getUserProfileImage(id);

    const normalizedProfileImage =
        data.profile_image && data.profile_image.trim() !== ""
            ? data.profile_image
            : existingProfileImage;

    return await updateUser(id, {
        ...data,
        profile_image: normalizedProfileImage
    });
};

// ================= DELETE USER =================
export const deleteUserService = async (id) => {
    return await deleteUser(id);
};

// ================= LOGIN =================
export const loginUserService = async (data) => {

    if (!data) {
        throw new Error("No data provided");
    }

    const { email, password } = data;

    const user = await loginUser(email);

    if (!user) {
        throw new Error("Invalid Email or Password");
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
        throw new Error("Invalid Email or Password");
    }

    if (Number(user.status) === 3) {
        throw new Error("Your account is pending admin approval.");
    }

    if (Number(user.status) === 0) {
        throw new Error("Your account has been inactive.");
    }

    const { password: _, ...result } = user;

    return result;
};
