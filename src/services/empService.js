import {employment, updateemployment} from "../models/employmentmodel.js";


export const  employmentService = async(data)=>{

    return await employment(data);

};

export const updateemploymentService = async(id, data)=>{

    return await updateemployment(id, data);
};
