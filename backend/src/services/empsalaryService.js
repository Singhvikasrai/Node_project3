import { emsalary, updateEmpsalary } from "../models/empsalaryModel.js"
import db from "../config/db.js";

export const salaryService=async(data)=>{

    return await emsalary(data)
};

export const updatesalaryService = async(id, data)=>{
    const existingSalaryRow = await db.execute("SELECT salary_image FROM empsalary WHERE id = ?", [id]);
    const existingSalaryImage = existingSalaryRow?.[0]?.[0]?.salary_image ?? null;

    const normalizedSalaryImage = typeof data?.salary_image === "string" && data.salary_image.trim() !== ""
        ? data.salary_image
        : existingSalaryImage;

    return await updateEmpsalary(id, {
        ...data,
        salary_image: normalizedSalaryImage
    });
};