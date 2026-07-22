import mysql from "mysql2/promise";
import "dotenv/config";

const db = await mysql.createConnection({

    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "123456",
    database: process.env.DB_NAME || "drivio_plan1",
    multipleStatements: false

});


const ensureColumn = async (tableName, columnName, definition) => {
    const [columns] = await db.execute(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND table_name = ?
           AND column_name = ?`,
        [tableName, columnName]
    );

    if (columns.length === 0) {
        await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    }
};

try {

    console.log("MySQL Connected");

   

    await db.execute(`

        CREATE TABLE IF NOT EXISTS users(

            id INT AUTO_INCREMENT PRIMARY KEY,

            name VARCHAR(100),

            password VARCHAR(100),

            mobile VARCHAR(10),

            pincode VARCHAR(6),

            email VARCHAR(50),

            role VARCHAR(20) NOT NULL DEFAULT 'user',

            profile_image VARCHAR(500) NULL,

            status TINYINT DEFAULT 0,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
            ON UPDATE CURRENT_TIMESTAMP

        )
    `);

    

    await db.execute(`

        CREATE TABLE IF NOT EXISTS state(

            id INT AUTO_INCREMENT PRIMARY KEY,

            state_name VARCHAR(50),

            status TINYINT CHECK (status IN (0,1,9,3)) DEFAULT 0

        )
    `);

   

    await db.execute(`

        CREATE TABLE IF NOT EXISTS city(

            id INT AUTO_INCREMENT PRIMARY KEY,

            city_name VARCHAR(50),

            state_id INT,

            status TINYINT CHECK (status IN (0,1,9)) DEFAULT 0,

            FOREIGN KEY (state_id) REFERENCES state(id)

        )
    `);

   

    await db.execute(`

        CREATE TABLE IF NOT EXISTS address(

            id INT AUTO_INCREMENT PRIMARY KEY,

            user_id INT,

            address_type VARCHAR(255),

            address VARCHAR(100),

            landmark VARCHAR(100),

            city_id INT,

            address_image VARCHAR(500) NULL,

            status TINYINT CHECK (status IN (0,1,9)) DEFAULT 0,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id) REFERENCES users(id),

            FOREIGN KEY (city_id) REFERENCES city(id)

        )
    `);

    

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

   

    await db.execute(`

        CREATE TABLE IF NOT EXISTS empsalary(

            id INT AUTO_INCREMENT PRIMARY KEY,

            user_id INT,

            empl_id INT,

            salary DECIMAL(10,2),

            start_date DATE,

            end_date DATE,

            status TINYINT CHECK (status IN (0,1,9)) DEFAULT 1,

            salary_image VARCHAR(500) NULL,

            FOREIGN KEY (user_id) REFERENCES users(id),

            FOREIGN KEY (empl_id) REFERENCES employment(id)

        )
    `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS user_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        primary_type VARCHAR(255), 
        primary_id INT,
        data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);

    // Pending registration/update requests used by the approval workflow.
    await db.execute(`
        CREATE TABLE IF NOT EXISTS pending_registrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            data JSON NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'Pending',
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_at TIMESTAMP NULL DEFAULT NULL,
            INDEX pending_status_created_at (status, created_at),
            INDEX pending_created_by_status (created_by, status),
            CONSTRAINT fk_pending_created_by
              FOREIGN KEY (created_by) REFERENCES users(id)
        )
    `);

    await ensureColumn("users", "role", "VARCHAR(20) NOT NULL DEFAULT 'user'");
    await ensureColumn("users", "profile_image", "VARCHAR(500) NULL");
    await ensureColumn("address", "address_image", "VARCHAR(500) NULL");
    await ensureColumn("empsalary", "status", "TINYINT NOT NULL DEFAULT 1");
    await ensureColumn("empsalary", "salary_image", "VARCHAR(500) NULL");
    

    console.log("All Tables Created Successfully");

} catch (err) {

    console.log(err);

}

export default db;
