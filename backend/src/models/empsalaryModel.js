import db from "../config/db.js";

export const emsalary = async (data) => {
    const {
        user_id,
        empl_id,
        salary,
        start_date,
        end_date,
        salary_status,
        salary_image
    } = data;

    const [result] = await db.execute(
        `INSERT INTO empsalary
        (user_id, empl_id, salary, start_date, end_date, status, salary_image)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            user_id,
            empl_id,
            salary,
            start_date,
            end_date,
            salary_status || 1, 
            salary_image 
        ]
    );

    return result;
};

export const updateEmpsalary = async (id, data = {}) => {
    const {
        salary,
        start_date,
        end_date,
        salary_status,
        salary_image,
    } = data;
    
    const [result] = await db.execute(
        `UPDATE empsalary 
        SET salary=?, start_date=?, end_date=?, status=?, salary_image=?   
        WHERE id=?`,
        [
            salary,
            start_date,
            end_date,
            salary_status,
            salary_image ?? null,
            id
        ]
    );

    return result;
};