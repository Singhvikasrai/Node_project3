import {Citymodel,updatecity}  from "../models/cityModel.js";



export const CityService = async (state_id) => {
    try {
       
        const cities = await Citymodel(state_id);
        return cities;
    } catch (error) {
        console.error("Error in CityService:", error);
        throw error;
    }
};

export const updateCityService = async (id, data) => {
    return await updatecity(id, data);
}; 
