import {stateservice, updatestateservice } from  "../services/stateService.js";

export const statecontroller = async (req, res) => {
    try {
        const result = await stateservice();

        res.json({
            message: "successful",
            data: result
        });

    } catch (error) {
        console.log("STATE CONTROLLER ERROR:", error);

        res.status(500).json({
            message: "Error fetching states",
            error: error.message
        });
    }
};

export const updateStatecontroller = async(req, res) => {
    const result = await updatestateservice(req.params.id, req.body);

    res.json({
        message: "State Updated Successfully",
        data: result,
    });
}
