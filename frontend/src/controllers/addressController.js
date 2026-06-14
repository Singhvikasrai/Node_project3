import{AddressService, getAddressService, updateAddressService} from '../services/addressService.js';


export const AddressController = async (req, res) => {

    const result = await AddressService(req.body)

    res.json({
        message: "Address Added Successfully",
        data: result,
    });
};

export const getAddressController = async (req, res) => {

    const result = await getAddressService(req.params.userId);

    res.json({
        message: "Address Fetched Successfully",
        data: result,
    });
};

export const updateAddressController = async(req, res) => {
    const result = await updateAddressService(req.params.id, req.body);

    res.json({
        message: "Address Updated Successfully",
        data: result,
    });
};
