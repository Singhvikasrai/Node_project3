import db from "../src/config/db.js";

try {
    const [rows] = await db.execute("DESCRIBE pending_registrations");
    console.log("pending_registrations Columns:", rows);
    db.destroy();
} catch (err) {
    console.error("Error inspecting database:", err);
}
