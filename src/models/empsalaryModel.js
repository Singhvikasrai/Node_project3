import db from "../config/db.js";

export const emsalary = async (data) => {

    const {
        user_id,
        empl_id,
        salary,
        start_date,
        end_date
    } = data;

    const [result] = await db.execute(
        `INSERT INTO empsalary
        (user_id, empl_id, salary, start_date, end_date)
        VALUES (?, ?, ?, ?, ?)`,
        [
            user_id,
            empl_id,
            salary,
            start_date,
            end_date
        ]
    );

    return result;
};

export const updateEmpsalary = async (id, data) => {
    const {
        
        salary,
        start_date,
        end_date
    } = data;
    const [result] = await db.execute(
        `UPDATE empsalary 
        SET  salary=?, start_date=?, end_date=?   
        WHERE id=?`,
        [
          
            salary,
            start_date,
            end_date,
            id
        ]
    );

    return result;
};