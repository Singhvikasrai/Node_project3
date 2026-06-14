import {CityService, updateCityService} from "../services/cityService.js";

export const cityController = async (req, res) => {
    try {
       
        const { state_id } = req.query;

     
        const result = await CityService(state_id);

        res.status(200).json({
            success: true,
            message: "Cities fetched successfully",
            data: result,
        });
        
    } catch (error) {
        console.error("Error in cityController:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const updateCityController = async(req, res) => {
    const result = await updateCityService(req.params.id, req.body);
    
    res.json({
        message: "City Updated Successfully",
        data: result,
    });
};
