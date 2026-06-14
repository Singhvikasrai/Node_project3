
import { addAddress,getAddress,updateAddress } from "../models/addressModel.js";

const AddressService = async (data) => {
    return await addAddress(data);
};

const getAddressService = async (userId) => {
    return await getAddress(userId);

};

const updateAddressService = async (id, data) => {
    return await updateAddress(id, data);
};


export {
    AddressService,
    getAddressService,
    updateAddressService    
    
};