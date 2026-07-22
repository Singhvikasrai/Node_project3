import { createUserProfile, getProfileLogs } from "../models/auditModel.js";


export const getService = async (userId) => {
  
  const data = await getProfileLogs(userId);
  return data;
};


export const createService = async (data) => {
  
  const result = await createUserProfile(data);

  
  return result;
}; 
