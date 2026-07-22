import {
    savePendingUpdateService,
    hasPendingUpdateForUserService,
    getPendingListService,
    getPendingByIdService,
    approvePendingService,
    rejectPendingService,
    applyDirectUpdateService
} from "../services/pendingService.js";
import { attachUploadedFiles } from "../utils/uploadPayload.js";


// ================= SAVE PENDING =================

export const savePendingController = async (req, res) => {
    try {
        const { data, user_id: requestedUserId } = req.body || {};

        if (!data) {
            return res.status(400).json({
                success:false,
                message:"data is required"
            });
        }

        let pendingData;
        try {
            pendingData = typeof data === "string" ? JSON.parse(data) : data;
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid pending data"
            });
        }

        attachUploadedFiles(pendingData, req.files);
        
        
        const hasUnresolvedUpload = [
            pendingData.user?.profile_image,
            ...(pendingData.addresses || []).map((address) => address.address_image),
            ...(pendingData.employments || []).flatMap((employment) =>
                (employment.salaries || []).map((salary) => salary.salary_image)
            )
        ].some((value) => typeof value === "string" && /^NEW_(ADDRESS|SALARY)_IMAGE_|^NEW_PROFILE_IMAGE_/.test(value));

        if (hasUnresolvedUpload) {
            return res.status(400).json({
                success: false,
                message: "File upload was not received. Please choose the file again and resubmit."
            });
        }


        const targetUserId = req.user.role === "admin"
            ? Number(requestedUserId)
            : Number(req.user.id);

        if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid user_id is required"
            });
        }

        if (req.user.role === "admin") {
            const result = await applyDirectUpdateService(targetUserId, pendingData);

            return res.status(200).json({
                success: true,
                message: "User details updated directly.",
                data: result
            });
        }

        const alreadyPending = await hasPendingUpdateForUserService(targetUserId);
        if (alreadyPending) {
            return res.status(409).json({
                success: false,
                message: "Your previous update request is still pending admin approval. You can edit again after it is approved or rejected."
            });
        }

        const result = await savePendingUpdateService(targetUserId, pendingData);


        return res.status(200).json({
            success:true,
            message:"Update request sent for approval",
            data:result
        });


    } catch(error){

        console.error("Save Pending Error:",error);

        return res.status(500).json({
            success:false,
            message:error.message
        });

    }
};




// ================= GET LIST =================

export const getPendingListController = async(req,res)=>{

    try{

        const result = await getPendingListService();


        res.status(200).json({
            success:true,
            data:result
        });


    }catch(error){

        console.error(error);

        res.status(500).json({
            success:false,
            message:error.message
        });
    }

};




// ================= GET BY ID =================

export const getPendingByIdController = async(req,res)=>{

    try{

        const {id}=req.params;


        const result = await getPendingByIdService(id);


        if(!result){

            return res.status(404).json({
                success:false,
                message:"Pending request not found"
            });

        }


        res.status(200).json({
            success:true,
            data:result
        });



    }catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

};




// ================= APPROVE =================

export const approvePendingController = async(req,res)=>{

    try{

        const {id}=req.params;


        const result = await approvePendingService(id);


        res.status(200).json({
            success:true,
            message:"Approved successfully",
            data:result
        });


    }catch(error){

        console.error(error);

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

};




// ================= REJECT =================

export const rejectPendingController = async(req,res)=>{

    try{


        const {id}=req.params;


        const result = await rejectPendingService(id);


        res.status(200).json({
            success:true,
            message:"Rejected successfully",
            data:result
        });


    }catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

};

export const getPendingEditStatusController = async (req, res) => {
    try {
        const hasPendingRequest = await hasPendingUpdateForUserService(req.user.id);

        return res.status(200).json({
            success: true,
            hasPendingRequest
        });
    } catch (error) {
        console.error("Get Pending Edit Status Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to check pending update status"
        });
    }
};
