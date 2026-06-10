import db from "../config/db.js";

const addAddress = async (data) => {
  const { user_id, address_type, address, landmark, city_id } = data;

  const [result] = await db.execute(
    `INSERT INTO address (user_id, address_type, address, landmark, city_id)
     VALUES (?, ?, ?, ?, ?)`,
    [user_id, address_type, address, landmark, city_id]
  );

  return result;
};

const getAddress = async (userId) => {
    
    const [rows] = await db.execute(
        `SELECT 
            u.id AS user_id,
            u.name,
            u.email,
            u.mobile,
            u.pincode,
            u.status AS user_status,

            a.id AS address_id,
            a.address,
            a.address_type,
            a.landmark,
            a.status AS address_status,

            c.id AS city_id,
            c.city_name,
            c.state_id,
            c.status AS city_status,

            st.id AS state_id,
            st.state_name,
            st.status AS state_status,

            e.id AS employment_id,
            e.company_name,
            e.company_address,
            e.pincode AS company_pincode,
            e.mobile AS company_mobile,
            e.email AS company_email,
            e.status AS employment_status,

            s.id AS salary_id,
            s.salary,
            s.start_date,
            s.end_date

        FROM users u

        LEFT JOIN address a
        ON u.id = a.user_id

        LEFT JOIN city c
        ON a.city_id = c.id

        LEFT JOIN state st
        ON c.state_id = st.id

        LEFT JOIN employment e
        ON u.id = e.user_id

        LEFT JOIN empsalary s
        ON e.id = s.empl_id

        WHERE u.id = ?`,
        [userId]
    )
    return rows;
  };

const updateAddress = async (id, data) => {
  const address_type = data.address_type ?? null;
  const address = data.address ?? null;
  const landmark = data.landmark ?? null;
  const city_id = data.city_id ?? null;
  const status = data.status ?? 1;

  const [result] = await db.execute(
    `UPDATE address 
     SET address_type=?, address=?, landmark=?, city_id=?, status=? 
     WHERE id=?`,
    [address_type, address, landmark, city_id, status, id]
  );

  return result;
};

export { addAddress, getAddress, updateAddress };
