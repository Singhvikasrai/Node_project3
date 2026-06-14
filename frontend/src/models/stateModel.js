import db from "../config/db.js";

export const statemodel = async () => {

    const [result] = await db.execute(
        `SELECT id, state_name FROM state ORDER BY state_name ASC`
    );

    return result;
};
export  const updatestate = async (id, data) => {

    const { state_name, status } = data;
    const [result] = await db.execute(
        `UPDATE state SET state_name=?, status=? WHERE id=?`,
        [state_name, status, id]
    );

    return result;
};