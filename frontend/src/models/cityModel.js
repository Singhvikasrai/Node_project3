import db from "../config/db.js";

export const Citymodel = async (state_id) => {
   
    if (!state_id) return [];

    const [result] = await db.execute(
        
        `SELECT id, city_name, state_id FROM city WHERE state_id = ? ORDER BY city_name ASC`,
        [state_id] 
    );

    return result;
};

export const updatecity = async (id, data) => {

    const { city_name, state_id, status } = data; 
    const [result] = await db.execute(
        `UPDATE city
        SET city_name=?, state_id=?, status=?
        WHERE id=?`,    
        
        [
            city_name,
            state_id,
            status,
            id
        ]
    );

    return result;
};
