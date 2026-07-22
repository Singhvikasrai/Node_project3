import { salaryService, updatesalaryService } from "../services/empsalaryService.js";
import { createService } from "../services/auditService.js";
import { toPublicUploadPath } from "../config/paths.js";

// INSERT SALARY
export const emsalaryController = async (req, res) => {
    try {
       
        const {
            user_id,
            empl_id,
            salary,
            salary_status,
            start_date,
            end_date
        } = req.body;

        const normalizedImagePath = req.file
            ? toPublicUploadPath(req.file.path)
            : null;

        const payload = {
            ...req.body,
            salary_image: normalizedImagePath
        };

        const result = await salaryService(payload);

        
        if (user_id) {
            
            const generatedId = result?.insertId || result?.id || result;

            const auditPayload = {
                user_id,
                primary_id: generatedId,  
                primary_type: "salary",
               
                data: JSON.stringify({
                    empl_id,
                    salary,
                    salary_status,
                    start_date,
                    end_date,
                    salary_image: normalizedImagePath || ""
                })
            };

            await createService(auditPayload);
        }

        res.json({
            message: "Salary Inserted Successfully",
            data: result
        });

    } catch (error) {
        console.error("Audit Insert Error Details:", error); 
        res.status(500).json({
            message: "Salary Insert Error",
            error: error.message
        });
    }
};


// UPDATE SALARY
export const updatesalaryController = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is required" });
        }

        const normalizedImagePath = req.file
            ? toPublicUploadPath(req.file.path)
            : req.body.salary_image || null;

        const payload = { ...req.body, salary_image: normalizedImagePath };

        const result = await updatesalaryService(req.params.id, payload);

        const { user_id, empl_id, salary, salary_status, start_date, end_date } = payload;

        if (user_id) {
            const auditPayload = {
                user_id,
                primary_id: req.params.id,
                primary_type: "salary",
              
                data: JSON.stringify({
                    empl_id,
                    salary,
                    salary_status,
                    start_date,
                    end_date,
                    salary_image: normalizedImagePath || ""
                })
            };

            await createService(auditPayload);
        }

        res.json({ message: "Salary Updated Successfully", data: result });

    } catch (error) {
        console.error("Audit Update Error Details:", error);
        res.status(500).json({
            message: "Salary Update Error",
            error: error.message
        });
    }
};
