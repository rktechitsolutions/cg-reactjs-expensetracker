const JWT = require("jsonwebtoken");
// import userModel from "../models/usersSchema.js";

// protected routes token base

exports.requireSignIn = async (req, res, next) => {
    try {
        const decode = JWT.verify(req.headers.authorization, process.env.JWT_SECRET);
        req.user = decode;
        next();
    } catch (error) {
        console.log(error);
    }
}

// export const isAdmin = async (req, res, next) => {
//     try {
//         const user = await userModel.findById(req.user._id);
//         if (user.role !== 1) {
//             return res.status(404).send({
//                 success: false,
//                 message: 'unaithorised access'
//             })
//         } else {
//             next();
//         }
//     } catch (error) {
//         console.log(error);
//         res.status(401).send({
//             success: false,
//             error,
//             message: 'error in admin middleware',
//         })
//     }
// }