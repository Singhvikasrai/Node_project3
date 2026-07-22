import { createService, getService } from "../services/auditService.js";


export const getAuditController = async (req, res) => {
  try {
    const id = req.query.userId || req.query.id;
    const data = await getService(id);

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error("Audit Controller Error:", error); 
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const createController = async (req, res) => {
  try {
    const data = req.body;
    const result = await createService(data);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Create Audit Error:", error); 
    res.status(500).json({
      success: false,
      message: error.message 
    });
  }
};
