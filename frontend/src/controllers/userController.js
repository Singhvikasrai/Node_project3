import {
    registerUserService,
    getUsersService,updateUserService,deleteUserService, loginUserService

} from "../services/userService.js";
import jwt from "jsonwebtoken";

// REGISTER
export const registerUserController = async (req, res) => {
    try {
        console.log("REQUEST BODY:", req.body);

        const result = await registerUserService(req.body);

        res.json({
            message: "User Registered Successfully",
            data: result
        });

    } catch (error) {
        console.log("REGISTER CONTROLLER ERROR:", error);

        res.status(500).json({
            message: "Error in Registration",
            error: error.message
        });
    }
};


// GET USERS
export const getUsersController = async (req, res) => {
    try {
        const result = await getUsersService();

        res.json({message: "Users fetched successfully",
            data: result});

    } catch (error) {
        res.status(500).json({message: "Error fetching users" });
    }
};

export const updateUserController = async (req, res) => {
  try {
    const result = await updateUserService(req.params.id, req.body);

    res.json({
      message: "User Updated Successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({ message: "Update Error" });
  }
};

export const deleteUserController = async (req, res) => {
    try {
        const result = await deleteUserService(req.params.id);

        res.json({
            message: "User Deleted Successfully",
            data: result
        });
    } catch (error) {
        console.error(error); 

        res.status(500).json({
            message: "Delete Error",
            error: error.message
        });
    }
};

export const loginUserController = async (req, res) => {
    try {
       
        const userWithoutPassword = await loginUserService(req.body);

       
        const token = jwt.sign(
            {
                id: userWithoutPassword.id, 
                email: userWithoutPassword.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "30min"
            }
        );

        // Success Response
        return res.status(200).json({
            success: true,
            message: "Login Successfully",
            token: token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error("Login Controller Error:", error.message);

      
        if (error.message === "Invalid Email or Password") {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }

       
        return res.status(500).json({
            success: false,
            message: "Login Error"
        });
    }
};