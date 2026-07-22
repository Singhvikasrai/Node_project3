import db from "../config/db.js";

// REGISTER USER
const registerUser = async (data) => {

    const { name, password, mobile, pincode, status, email,profile_image} = data;

    const [result] = await db.execute(`INSERT INTO users(name, password, mobile, pincode,status, email, profile_image)VALUES (?,?,?,?,?,?,?)`,
        [name,password,mobile,pincode,status, email,profile_image]);

    return result;
};
  
const registerUserWithDetails = async ({ user, addresses = [], employments = [] }) => {
    await db.beginTransaction();
    try {
        const userResult = await registerUser({ ...user, status: 3 });
        const userId = userResult.insertId;

        for (const address of addresses) {
            await db.execute(`INSERT INTO address (user_id, address_type, address, landmark, city_id, address_image) VALUES (?, ?, ?, ?, ?, ?)`, [userId, address.address_type, address.address, address.landmark, address.city_id, address.address_image || null]);
        }
        for (const employment of employments) {
            const [employmentResult] = await db.execute(`INSERT INTO employment (user_id, company_name, company_address, pincode, mobile, email) VALUES (?, ?, ?, ?, ?, ?)`, [userId, employment.company_name, employment.company_address, employment.company_pincode || employment.pincode, employment.company_mobile || employment.mobile, employment.company_email || employment.email]);
            for (const salary of employment.salaries || []) {
                await db.execute(`INSERT INTO empsalary (user_id, empl_id, salary, start_date, end_date, status, salary_image) VALUES (?, ?, ?, ?, ?, ?, ?)`, [userId, employmentResult.insertId, salary.salary, salary.start_date, salary.end_date, salary.salary_status || 1, salary.salary_image || null]);
            }
        }

        await db.commit();
        return { insertId: userId };
    } catch (error) {
        await db.rollback();
        throw error;
    }
};

const getUserById = async (id) => {
    const [rows] = await db.execute(
        `
        SELECT id, name, mobile, pincode, email, status, created_at, updated_at, role, profile_image
        FROM users
        WHERE id = ?
        `,
        [id]
    );

    return rows[0];
};
 const getUsers = async (offset, limit) => {
    const [rows] = await db.query(
        `
        SELECT id, name, mobile, pincode, email, status, created_at, updated_at, role
        FROM users
        LIMIT ?, ?
        `,
        [offset, limit]
    );

    return rows;
};
const countUsers = async () => {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM users");
    return rows[0].total;
};

const getUserProfileImage = async (id) => {
    const [rows] = await db.execute("SELECT profile_image FROM users WHERE id = ?", [id]);
    return rows[0]?.profile_image || null;
};

const updateUser = async (id, data) => {

    const {
        name,
        mobile,
        pincode,
        email,
        status,
        profile_image
    } = data;

    const [result] = await db.execute(
        `UPDATE users
         SET
            name = ?,
            mobile = ?,
            pincode = ?,
            email = ?,
            status = ?,
            profile_image = ?
         WHERE id = ?`,
        [
            name,
            mobile,
            pincode,
            email,
            status,
            profile_image,
            id
        ]
    );

    return result;
};
const deleteUser = async (id) => {
    await db.beginTransaction();

    try {
        await db.execute(
            `DELETE empsalary FROM empsalary
             JOIN employment ON empsalary.empl_id = employment.id
             WHERE employment.user_id = ?`,
            [id]
        );

        await db.execute("DELETE FROM employment WHERE user_id = ?", [id]);
        await db.execute("DELETE FROM address WHERE user_id = ?", [id]);
        await db.execute("DELETE FROM pending_registrations WHERE created_by = ?", [id]);
        await db.execute("DELETE FROM user_profiles WHERE user_id = ?", [id]);
        const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);

        await db.commit();
        return result;
    } catch (error) {
        await db.rollback();
        throw error;
    }
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
    registerUserWithDetails,
    getUsers,
    countUsers,
    getUserProfileImage,
    updateUser,
    deleteUser,
   loginUser,
   getUserById 
};
