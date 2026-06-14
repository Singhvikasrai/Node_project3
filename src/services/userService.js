import { 
    registerUser, 
    getUsers, 
    updateUser, 
    deleteUser, 
   loginUser 
} from "../models/userModel.js";
import bcrypt from 'bcryptjs';

export const registerUserService = async (data) => {
    const { name, mobile, pincode, email, password } = data;

    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Hashed password ke sath user register karein
    return await registerUser({
        name,
        mobile,
        pincode,
        email,
        password: hashedPassword 
    });
};

export const getUsersService = async () => {
    return await getUsers();
};

export const updateUserService = async (id, data) => {
    return await updateUser(id, data);
};

export const deleteUserService = async (id, data) => {
    return await deleteUser(id, data);
};

export const loginUserService = async (data) => {
    const { email, password } = data;
    
   
    const user = await loginUser(email); 
    
  
    if (!user) {
        throw new Error("Email not found");
    } 

   console.log("User ne jo password dala:", password);
   console.log("Database mein jo password mila:", user.password);

  const isPasswordMatch = (password === user.password);
    
    
    if (!isPasswordMatch) {
        throw new Error("Invalid Password"); 
    } 

    // 3. Safe data return karein
    const { password: _, ...result } = user.toObject ? user.toObject() : user;
    return result; 
};