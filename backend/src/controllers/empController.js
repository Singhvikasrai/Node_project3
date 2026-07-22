import { employmentService, updateemploymentService } from "../services/empService.js";
import { createService } from "../services/auditService.js";

export const employmentController=async (req, res)=>{

    const result = await employmentService(req.body)
    const { user_id, company_name, company_address, pincode, mobile, email } = req.body;

    if (user_id) {
        await createService({
            user_id,
            primary_id: result.insertId,
            primary_type: "employment",
            data: {
                company_name,
                company_address,
                pincode,
                mobile,
                email
            }
        });
    }


    res.json({ message: "successfuly", 
                data: result,
     });
};

export const updateEmploymentController = async(req, res) => {
    try {
        const result = await updateemploymentService(req.params.id, req.body);

        const {
            user_id,
            company_name,
            company_address,
            pincode,
            status,
            mobile,
            email
        } = req.body;

        if (user_id) {
            await createService({
                user_id: user_id,
                primary_id: req.params.id,
                primary_type: "employment",
                data: {
                    company_name,
                    company_address,
                    pincode,
                    status,
                    mobile,
                    email,
                  
                }
            });
        }

        res.json({
            message: "Employment Updated Successfully",
            data: result
        });

    } catch(error) {
        console.log(error);
        res.status(500).json({
            message: "Employment Update Error"
        });
    }
}; 


