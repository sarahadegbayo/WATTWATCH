import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { BASE_URL, EMAIL_USERNAME, JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";
import { v4 as uuidv4 } from 'uuid';
import { transporter } from "../config/nodemailer.js";

const signUpController = (req, res) => {
    res.render("signup", { title: "Sign Up", error: null });
};

const signUpPostController = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        if (!fullname || !email || !password) {
            return res.status(400).render("signup", {
                title: "Sign Up",
                error: "All fields are required",
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).render("signup", {
                title: "Sign Up",
                error: "Email already registered",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullname,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        res.redirect("/api/v1/auth/account-creation-success");
    } catch (error) {
        console.error("Signup error:", error.message);
        res.status(500).render("signup", {
            title: "Sign Up",
            error: "An error occurred. Please try again later.",
        });
    }
};

const signinController = (req, res) => {
    res.render("signin", { title: "Sign In", error: null });
};


const signinPostController = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).render("signin", {
                title: "Sign In",
                error: "Email and password are required",
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render("signin", {
                title: "Sign In",
                error: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render("signin", {
                title: "Sign In",
                error: "Invalid email or password",
            });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN || "1h",
        });

        res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });

        res.redirect("/dashboard"); // Redirect instead of rendering
    } catch (error) {
        console.error("Signin error:", error.message);
        res.status(500).render("signin", {
            title: "Sign In",
            error: "An error occurred. Please try again later.",
        });
    }
};

const signoutController = (req, res) => {
    res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    if (req.session) {
        req.session.destroy((err) => {
            if (err) console.error("Session destruction error:", err);
        });
    }
    res.redirect("/api/v1/auth/signin");
};

const requestPasswordChange = (req, res) => {
    res.render('forgotpassword', { csrfToken: res.locals.csrfToken });
};

const sendEmailForPasswordChange = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email not found.' });
        }

        const resetToken = uuidv4();
        const resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        const resetLink = `${process.env.BASE_URL}/api/v1/auth/reset/${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Password Reset Request - WattWatch',
            html: `
                <h2>Password Reset Request</h2>
                <p>You requested a password reset for your WattWatch account.</p>
                <p>Click the link below to reset your password (valid for 1 hour):</p>
                <a href="${resetLink}">Reset Password</a>
                <p>If you did not request this, please ignore this email.</p>
                <p>© 2025 WattWatch. All rights reserved.</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (error) {
        console.error('Error in sendEmailForPasswordChange:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).render('resetpassword', { title: "Reset Password", error: "Invalid or expired token.", csrfToken: res.locals.csrfToken });
        }
        res.render('resetpassword', { title: "Reset Password", error: null, token, csrfToken: res.locals.csrfToken });
    } catch (error) {
        console.error("Reset password error:", error.message);
        res.status(500).render('resetpassword', { title: "Reset Password", error: "An error occurred. Please try again later.", csrfToken: res.locals.csrfToken });
    }
};

const updatePassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        res.status(200).json({ success: "Password updated successfully! Redirecting to login..." });
    } catch (error) {
        console.error("Update password error:", error.message);
        res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

const dashboardController = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect("/api/v1/auth/signin");
        }

        const user = req.user.id ? await User.findById(req.user.id) : null;

        if (!user && req.user.id) {
            res.clearCookie("token");
            return res.redirect("/api/v1/auth/signin");
        }

        res.render("dashboard", {
            title: "Dashboard",
            user: user || req.user, // Using full user object if fetched, otherwise use token payload
            csrfToken: res.locals.csrfToken
        });
    } catch (error) {
        console.error("Dashboard error:", error.message);
        res.clearCookie("token");
        res.redirect("/api/v1/auth/signin");
    }
};



export {
    signUpController,
    signUpPostController,
    signinController,
    signinPostController,
    signoutController,
    sendEmailForPasswordChange,
    requestPasswordChange,
    resetPassword,
    updatePassword,
    dashboardController
};