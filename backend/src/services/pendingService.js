import {
    savePendingUpdate,
    hasPendingUpdateForUser,
    getPendingList,
    getPendingById,
    updatePendingStatus
} from "../models/pendingModel.js";

import { updateUserService } from "./userService.js";
import { registerUser } from "../models/userModel.js";
import { addAddress, updateAddress } from "../models/addressModel.js";
import { employment, updateemployment } from "../models/employmentmodel.js";
import { emsalary, updateEmpsalary } from "../models/empsalaryModel.js";
import { createService as createAuditLog } from "./auditService.js";

// Helper for wrapper services
export const savePendingUpdateService = (userId, body) => savePendingUpdate(userId, body);
export const hasPendingUpdateForUserService = (userId) => hasPendingUpdateForUser(userId);
export const getPendingListService = () => getPendingList();
export const getPendingByIdService = (id) => getPendingById(id);

// --- Reuseable Helper Functions to Remove Duplication ---

const handleAddressLog = async (userId, addrId, addr, userPincode) => {
    await createAuditLog({
        user_id: userId,
        primary_id: addrId,
        primary_type: "address",
        data: {
            address_type: addr.address_type,
            address: addr.address,
            landmark: addr.landmark,
            city: addr.city_name || "",
            pincode: userPincode || "",
            status: addr.address_status,
            address_image: addr.address_image || ""
        }
    });
};

const handleEmploymentLog = async (userId, empId, emp) => {
    await createAuditLog({
        user_id: userId,
        primary_id: empId,
        primary_type: "employment",
        data: {
            company_name: emp.company_name,
            company_address: emp.company_address,
            pincode: emp.company_pincode || emp.pincode,
            mobile: emp.company_mobile || emp.mobile,
            email: emp.company_email || emp.email,
            status: emp.employment_status
        }
    });
};

const handleSalaryLog = async (userId, empId, salId, sal) => {
    await createAuditLog({
        user_id: userId,
        primary_id: salId,
        primary_type: "salary",
        data: {
            empl_id: empId,
            salary: sal.salary,
            salary_status: sal.salary_status || 1,
            start_date: sal.start_date,
            end_date: sal.end_date,
            salary_image: sal.salary_image || ""
        }
    });
};

const processSalaries = async (userId, empId, salaries) => {
    if (!Array.isArray(salaries)) return;
    for (const sal of salaries) {
        if (String(sal.salary_status) === "9") continue;

        if (sal.isNew || !sal.salary_id) {
            const res = await emsalary({
                user_id: userId,
                empl_id: empId,
                salary: sal.salary,
                start_date: sal.start_date,
                end_date: sal.end_date,
                salary_status: sal.salary_status || 1,
                salary_image: sal.salary_image || null
            });
            await handleSalaryLog(userId, empId, res.insertId, sal);
        } else {
            await updateEmpsalary(sal.salary_id, {
                salary: sal.salary,
                start_date: sal.start_date,
                end_date: sal.end_date,
                salary_status: sal.salary_status,
                salary_image: sal.salary_image || null
            });
            await handleSalaryLog(userId, empId, sal.salary_id, sal);
        }
    }
};

// --- Main Service Logic ---

export const approvePendingService = async (id, directData = null, directUserId = null) => {
    const pending = directData ? null : await getPendingById(id);
    if (!directData && !pending) throw new Error("Pending request not found");

    const updateData = directData || (typeof pending.data === "object" ? pending.data : JSON.parse(pending.data));
    let userId = directUserId || pending.created_by;
    let result;

    if (!userId) {
        // Create New User Path
        const userPayload = {
            name: updateData.user.name,
            password: updateData.user.password,
            mobile: updateData.user.mobile,
            pincode: updateData.user.pincode,
            status: 1,
            email: updateData.user.email,
            profile_image: updateData.user.profile_image || null
        };
        result = await registerUser(userPayload);
        userId = result.insertId;

        await createAuditLog({
            user_id: userId,
            primary_id: userId,
            primary_type: "user",
            data: { ...userPayload, profile_image: userPayload.profile_image || "" }
        });
    } else if (updateData.user) {
        // Update Existing User Path
        result = await updateUserService(userId, updateData.user);
        await createAuditLog({
            user_id: userId,
            primary_id: userId,
            primary_type: "user",
            data: {
                name: updateData.user.name,
                email: updateData.user.email,
                mobile: updateData.user.mobile,
                pincode: updateData.user.pincode,
                status: updateData.user.status,
                profile_image: updateData.user.profile_image || ""
            }
        });
    }

    // Process Addresses
    if (Array.isArray(updateData.addresses)) {
        for (const addr of updateData.addresses) {
            if (String(addr.address_status) === "9") continue;

            if (!userId || addr.isNew || !addr.address_id) {
                const res = await addAddress({
                    user_id: userId,
                    address_type: addr.address_type,
                    address: addr.address,
                    landmark: addr.landmark,
                    city_id: addr.city_id,
                    address_image: addr.address_image || null
                });
                await handleAddressLog(userId, res.insertId, addr, updateData.user?.pincode);
            } else {
                await updateAddress(addr.address_id, {
                    address_type: addr.address_type,
                    address: addr.address,
                    landmark: addr.landmark,
                    city_id: addr.city_id,
                    status: addr.address_status,
                    address_image: addr.address_image || null
                });
                await handleAddressLog(userId, addr.address_id, addr, updateData.user?.pincode);
            }
        }
    }

    // Process Employments & Salaries
    if (Array.isArray(updateData.employments)) {
        for (const emp of updateData.employments) {
            if (String(emp.employment_status) === "9") continue;
            let currentEmpId = emp.employment_id;

            if (!userId || emp.isNew || !currentEmpId) {
                const res = await employment({
                    user_id: userId,
                    company_name: emp.company_name,
                    company_address: emp.company_address,
                    pincode: emp.company_pincode || emp.pincode,
                    mobile: emp.company_mobile || emp.mobile,
                    email: emp.company_email || emp.email
                });
                currentEmpId = res.insertId;
                await handleEmploymentLog(userId, currentEmpId, emp);
            } else {
                await updateemployment(currentEmpId, {
                    company_name: emp.company_name,
                    company_address: emp.company_address,
                    pincode: emp.company_pincode || emp.pincode,
                    mobile: emp.company_mobile || emp.mobile,
                    email: emp.company_email || emp.email,
                    status: emp.employment_status
                });
                await handleEmploymentLog(userId, currentEmpId, emp);
            }

            await processSalaries(userId, currentEmpId, emp.salaries);
        }
    }

    if (!directData) {
        await updatePendingStatus(id, "Approved");
    }

    return result;
};

export const applyDirectUpdateService = async (userId, updateData) =>
    approvePendingService(null, updateData, userId);

export const rejectPendingService = (id) => updatePendingStatus(id, "Rejected");
