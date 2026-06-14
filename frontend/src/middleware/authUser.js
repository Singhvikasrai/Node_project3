import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.json({
                success: false,
                message: 'Not Authorized Login Again'
            });
        }

       
        const token = authHeader.split(" ")[1];

        // VERIFY HERE ✔
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);

       
        next();

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: error.message
        });
    }
};

export default authUser;