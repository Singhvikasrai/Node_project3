import { registerUser, getUsers, updateUser, deleteUser, loginUser} from "../models/userModel.js";

// REGISTER SERVICE
export const registerUserService = async (data) => {

    const { name, mobile, pincode, email, password } = data;

    return await registerUser({
        name,
        mobile,
        pincode,
        email,
        password
    });
};

// get SERVICE
export const getUsersService = async () => {
    return await getUsers();
};

// update service
export const updateUserService = async (id, data) => {
  return await updateUser(id, data);
};

export const deleteUserService = async (id,data) => {
    return await deleteUser(id, data);
};

export const loginUserService = async (data) => {
    return await loginUser(data);

};

