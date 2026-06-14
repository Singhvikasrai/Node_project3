import {statemodel, updatestate} from  "../models/stateModel.js";

export const stateservice = async(data)=>{

    return await statemodel(data);
};

export const updatestateservice = async(id, data)=>{
    return await updatestate(id, data);
};

