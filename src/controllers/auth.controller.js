import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";

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

        res.redirect("/dashboard");
    } catch (error) {
        console.error("Signin error:", error.message);
        res.status(500).render("signin", {
            title: "Sign In",
            error: "An error occurred. Please try again later.",
        });
    }
};

const signoutController = (req, res) => {
    // Clear the token cookie
    res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    // Destroy session if using express-session
    if (req.session) {
        req.session.destroy((err) => {
            if (err) console.error("Session destruction error:", err);
        });
    }
    // Redirect to signin page
    res.redirect("/api/v1/auth/signin");
};

export { signUpController, signUpPostController, signinController, signinPostController, signoutController };