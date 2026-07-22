import { AddressService, getAddressService, updateAddressService } from '../services/addressService.js';
import { createService } from "../services/auditService.js";
import { toPublicUploadPath } from "../config/paths.js";


export const AddressController = async (req, res) => {
    try {
        const normalizedImagePath = req.file
            ? toPublicUploadPath(req.file.path)
            : null;
        const payload = {...req.body, address_image: normalizedImagePath };

        const result = await AddressService(payload);

     
        const { user_id, address_type, address, landmark, city_name, pincode } = req.body || {};

        if (user_id) {
            await createService({
                user_id: user_id,
                primary_id: result.insertId,
                primary_type: "address",
                data: {
                    address_type: address_type || "",
                    address: address,
                    landmark: landmark,
                    city: city_name || "",
                    pincode: pincode || "",
                    address_image: normalizedImagePath || ""
                }
            });
        }

        res.json({
            success: true,
            message: "Address Added Successfully",
            data: result,
        });
    } catch (error) {
        console.error("Add Address Controller Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getAddressController = async (req, res) => {
    try {
        const result = await getAddressService(req.params.userId);

        res.json({
            success: true,
            message: "Address Fetched Successfully",
            data: result,
                
        });
        console.log("Fetched Address Data------------------------------------->>>>>:", result);
    } catch (error) {
        console.error("Get Address Controller Error-------------------->>>>>:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const updateAddressController = async (req, res) => {
    try {
        const addressId = req.params.id;
        const body = req.body || {};

        if (!body || Object.keys(body).length === 0) {
            return res.status(400).json({ success: false, message: "Request body is required" });
        }

        const { user_id, address_type, address, landmark, city_id, status, city_name, pincode } = body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "user_id is required in the body to create history log."
            });
        }

        const normalizedImagePath = req.file
            ? toPublicUploadPath(req.file.path)
            : body.address_image || null;

        const payload = { ...body, address_image: normalizedImagePath };

        const result = await updateAddressService(addressId, payload);

        await createService({
            user_id: user_id,
            primary_id: addressId,
            primary_type: "address",
            data: {
                address_type: address_type || "home",
                address: address,
                landmark: landmark,
                status: status,
                city: city_name || "",
                pincode: pincode || "",
                address_image: normalizedImagePath || ""
            }
        });

        res.json({
            success: true,
            message: "Address Updated Successfully",
            data: result,
        });
    } catch (error) {
        console.error("Update Address Controller Error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
