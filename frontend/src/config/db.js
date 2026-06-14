import mysql from "mysql2/promise";

const db = await mysql.createConnection({

    host: "localhost",
    user: "root",
    password: "123456",
    database: "drivio_plan1"

});

try {

    console.log("MySQL Connected");

    // ================= USERS TABLE =================

    await db.execute(`

        CREATE TABLE IF NOT EXISTS users(

            id INT AUTO_INCREMENT PRIMARY KEY,

            name VARCHAR(100),

            password VARCHAR(100),

            mobile VARCHAR(10),

            pincode VARCHAR(6),

            email VARCHAR(50),

            status TINYINT DEFAULT 0,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
            ON UPDATE CURRENT_TIMESTAMP

        )
    `);

    // ================= STATE TABLE =================

    await db.execute(`

        CREATE TABLE IF NOT EXISTS state(

            id INT AUTO_INCREMENT PRIMARY KEY,

            state_name VARCHAR(50),

            status TINYINT CHECK (status IN (0,1,9)) DEFAULT 0

        )
    `);

    // ================= CITY TABLE =================

    await db.execute(`

        CREATE TABLE IF NOT EXISTS city(

            id INT AUTO_INCREMENT PRIMARY KEY,

            city_name VARCHAR(50),

            state_id INT,

            status TINYINT CHECK (status IN (0,1,9)) DEFAULT 0,

            FOREIGN KEY (state_id) REFERENCES state(id)

        )
    `);

    // ================= ADDRESS TABLE =================

    await db.execute(`

        CREATE TABLE IF NOT EXISTS address(

            id INT AUTO_INCREMENT PRIMARY KEY,

            user_id INT,

            address_type VARCHAR(255),

            address VARCHAR(100),

            landmark VARCHAR(100),

            city_id INT,

            status TINYINT CHECK (status IN (0,1,9)) DEFAULT 0,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id) REFERENCES users(id),

            FOREIGN KEY (city_id) REFERENCES city(id)

        )
    `);

    // ================= EMPLOYMENT TABLE =================

    await db.execute(`

        CREATE TABLE IF NOT EXISTS employment(

            id INT AUTO_INCREMENT PRIMARY KEY,

            user_id INT,

            company_name VARCHAR(100),

            company_address VARCHAR(255),

            pincode VARCHAR(6),

            mobile VARCHAR(10),

            email VARCHAR(50),

            status TINYINT CHECK (status IN (0,1,9)) DEFAULT 0,

            FOREIGN KEY (user_id) REFERENCES users(id)

        )
    `);

    // ================= EMP SALARY TABLE =================

    await db.execute(`

        CREATE TABLE IF NOT EXISTS empsalary(

            id INT AUTO_INCREMENT PRIMARY KEY,

            user_id INT,

            empl_id INT,

            salary DECIMAL(10,2),

            start_date DATE,

            end_date DATE,

            FOREIGN KEY (user_id) REFERENCES users(id),

            FOREIGN KEY (empl_id) REFERENCES employment(id)

        )
    `);

    console.log("All Tables Created Successfully");

} catch (err) {

    console.log(err);

}

export default db;