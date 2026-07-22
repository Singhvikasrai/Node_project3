
import { addAddress,getAddress,updateAddress } from "../models/addressModel.js";
import db from "../config/db.js";

const AddressService = async (data) => {
    return await addAddress(data);
};

const getAddressService = async (userId) => {
    return await getAddress(userId);

};

const updateAddressService = async (id, data) => {
    const existingAddressRow = await db.execute("SELECT address_image FROM address WHERE id = ?", [id]);
    const existingAddressImage = existingAddressRow?.[0]?.[0]?.address_image ?? null;

    const normalizedAddressImage = typeof data?.address_image === "string" && data.address_image.trim() !== ""
        ? data.address_image
        : existingAddressImage;

    return await updateAddress(id, {
        ...data,
        address_image: normalizedAddressImage
    });
};


export {
    AddressService,
    getAddressService,
    updateAddressService    
    
};