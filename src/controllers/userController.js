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

        const result = await loginUserService(req.body);

        // User Found
        if (result.length > 0) {

            // JWT TOKEN GENERATE
            const token = jwt.sign(

                {

                    id: result[0].id,
                    email: result[0].email
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "30min"
                }
            );
            const user = result[0];

            const { password, ...userWithoutPassword } = user;

            res.json({

                success: true,

                message: "Login Successfully",

                token: token,

                user: userWithoutPassword

            });

        } else {

            res.status(401).json({

                success: false,

                message: "Invalid Email or Password"
            });
        }

    } catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: "Login Error"
        });
    }
};