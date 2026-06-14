import db from "../config/db.js";

// REGISTER USER
const registerUser = async (data) => {

    const { name, password, mobile, pincode, email} = data;

    const [result] = await db.execute(`INSERT INTO users(name, password, mobile, pincode, email)VALUES (?,?,?,?,?)`,
        [name,password,mobile,pincode,email]);

    return result;
};


// GET USERS
const getUsers = async () => {

    const [rows] = await db.execute(`SELECT id, name, mobile, pincode, email, status, created_at, updated_at  FROM users`);

    return rows;
};


// UPDATE USER
const updateUser = async (id, data) => {

    const {
        name,
        mobile,
        pincode,
        email,
        status
    } = data;

    const [result] = await db.execute(
        `UPDATE users 
         SET name=?, mobile=?, pincode=?, email=?, status=? 
         WHERE id=?`,
        [
            name,
            mobile,
            pincode,
            email,
            status,
            id
        ]
    );

    return result;
};

const deleteUser = async (id) => {

   
    await db.execute(
        `DELETE empsalary FROM empsalary 
         JOIN employment ON empsalary.empl_id = employment.id
         WHERE employment.user_id = ?`,
        [id]
    );

    await db.execute(
        `DELETE FROM employment WHERE user_id = ?`,
        [id]
    );

   
    await db.execute(
        `DELETE FROM address WHERE user_id = ?`,
        [id]
    );

 
    const [result] = await db.execute(
        `DELETE FROM users WHERE id = ?`,
        [id]
    );

    return result;
};

const loginUser = async (email) => {

    const [result] = await db.execute(
        `SELECT * FROM users WHERE email = ?`,

        [email]
    );
    return result[0];
};

export {
    registerUser,
    getUsers,
    updateUser,
    deleteUser,
   loginUser
};