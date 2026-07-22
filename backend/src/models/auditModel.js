import db from "../config/db.js";

export const getProfileLogs = async (userId) => {

let sql = `
SELECT 
    up.*,
    e.company_name,
    u.name,
    u.email

FROM user_profiles up

LEFT JOIN employment e 
ON JSON_EXTRACT(up.data,'$.empl_id') = e.id

LEFT JOIN users u
ON up.user_id = u.id
`;

let params=[];



if(userId){
    sql += " WHERE up.user_id = ?";
    params.push(userId);
}


sql += " ORDER BY up.created_at DESC";


const [rows] = await db.execute(sql,params);

return rows;

};

export const createUserProfile = async (profileData) => {

  const {
    user_id,
    primary_id,
    primary_type,
    data
  } = profileData;


  const query = `
    INSERT INTO user_profiles
    (
      user_id,
      primary_id,
      primary_type,
      data
    )
    VALUES (?, ?, ?, ?)
  `;


  // Controllers may pass an object or an already serialized JSON payload.
  // Store valid JSON once; double-stringifying breaks JSON_EXTRACT and audit views.
  const serializedData = typeof data === "string" ? data : JSON.stringify(data);

  const values = [
    user_id,
    primary_id || null,
    primary_type,
    serializedData
  ];


  const [result] = await db.execute(query, values);

  return result;
};
