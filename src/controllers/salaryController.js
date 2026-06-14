import { salaryService, updatesalaryService } from "../services/empsalaryService.js"


export const emsalaryController= async(req,res)=>{

    const result = await salaryService(req.body)

    res.json({massage:" successfully",
        data:result
    })


};

export const updatesalaryController = async(req, res) => {
    const result = await updatesalaryService(req.params.id, req.body);

    res.json({
        message: "Salary Updated Successfully",
        data: result,
    });
};