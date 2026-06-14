import db from "../config/db.js";

 export const employment = async (data)=>{

    const {user_id, company_name, company_address, pincode, mobile, email}=data;

    const [result]= await db.execute(`insert into employment(user_id, company_name, company_address, pincode, mobile, email) values(?,?,?,?,?,?)`,
         [user_id, company_name, company_address, pincode, mobile, email]); 
        
        return result;
        };

export const updateemployment = async (id, data) => {

    const { company_name, company_address, pincode, mobile, email, status } = data;
      const [result] = await db.execute(
         `UPDATE employment
            SET company_name=?, company_address=?, pincode=?, mobile=?, email=?, status=?
            WHERE id=?`,
         [company_name, company_address, pincode, mobile, email, status, id]
      );

      return result;
   };


