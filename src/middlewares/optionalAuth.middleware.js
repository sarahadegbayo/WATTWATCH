
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

const optionalAuth = (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            console.debug("Optional auth: Token verified for user:", decoded.email);
        } catch (error) {
            console.warn("Optional auth: Invalid token", error.message);
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
};

export default optionalAuth;