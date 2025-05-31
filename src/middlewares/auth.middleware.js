// auth.middleware.js
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    // Check if token exists
    if (!token) {
        console.warn("No token provided, redirecting to sign-in");
        return res.redirect("/api/v1/auth/signin");
    }

    try {
        // Verify and decode the token
        const decoded = jwt.verify(token, JWT_SECRET);
        // Attach the decoded payload to req.user
        req.user = decoded;
        console.debug("Token verified successfully for user:", decoded.email);
        next();
    } catch (error) {
        // Handle specific JWT errors
        console.error("Token verification failed:", {
            message: error.message,
            name: error.name,
            expiredAt: error.expiredAt || "N/A",
        });
        res.clearCookie("token"); // Clear invalid token
        return res.redirect("/api/v1/auth/signin");
    }
};

export default authenticateToken;