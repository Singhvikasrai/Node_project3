import { employmentService, updateemploymentService } from "../services/empService.js";

export const employmentController=async (req, res)=>{

    const result = await employmentService(req.body)


    res.json({ message: "successfuly", 
                data: result,
     });
};

export const updateEmploymentController = async(req, res) => {
    const result = await updateemploymentService(req.params.id, req.body); 

    res.json({
        message: "Employment Updated Successfully",
        data: result,
    }); 

};