import db from "../config/db.js";

// Save Pending Edit
export const savePendingUpdate = async (userId, data) => {
    const [result] = await db.execute(
        `INSERT INTO pending_registrations
        (data, status, created_by)
        VALUES (?, 'Pending', ?)`,
        [
            JSON.stringify(data),
            userId
        ]
    );

    return result.insertId;
};

// Pending List
export const getPendingList = async () => {
    const [rows] = await db.execute(`
        SELECT *
        FROM pending_registrations
        WHERE status = 'Pending'
        ORDER BY created_at DESC
    `);

    return rows;
};

// Pending By Id
export const getPendingById = async (id) => {
    const [rows] = await db.execute(
        `
        SELECT *
        FROM pending_registrations
        WHERE id = ?
        `,
        [id]
    );

    return rows[0];
};

// Update Pending Status
export const updatePendingStatus = async (id, status) => {
    const [result] = await db.execute(
        `
        UPDATE pending_registrations
        SET status = ?,
            approved_at = NOW()
        WHERE id = ?
        `,
        [status, id]
    );

    return result;
};

// A user can have only one update request waiting for an admin decision.
export const hasPendingUpdateForUser = async (userId) => {
    const [rows] = await db.execute(
        `SELECT id
         FROM pending_registrations
         WHERE created_by = ? AND status = 'Pending'
         LIMIT 1`,
        [userId]
    );

    return rows.length > 0;
};
