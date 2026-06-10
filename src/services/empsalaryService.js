import { emsalary, updateEmpsalary } from "../models/empsalaryModel.js"


export const salaryService=async(data)=>{

    return await emsalary(data)
};

export const updatesalaryService = async(id, data)=>{
    return await updateEmpsalary(id, data);
};