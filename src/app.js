import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import csurf from "csurf";
import path from "path";
import { PORT, SESSION_KEY } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";
import authenticateToken from "./middlewares/auth.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { publicNavRouter } from "./routes/publicNav.routes.js";
import { authNavRouter } from "./routes/authNav.routes.js";
import optionalAuth from "./middlewares/optionalAuth.middleware.js";

const app = express();

// 1. Core Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan("dev"));

// 2. Session Middleware
app.use(
    session({
        secret: SESSION_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: process.env.NODE_ENV === "production" },
    })
);

// 3. CSRF Protection
app.use(csurf());
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

// 4. View Engine and Static Files
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));
app.use(express.static(path.join(process.cwd(), "src", "public")));

// Apply to all routes to set req.user if token exists
app.use(optionalAuth);

// 5. Routes
// Homepage (public)
app.get("/", (req, res) => {
    res.render("landingpage", {
        title: "Watt-WATCH Home",
        isAuthenticated: !!req.user,
        csrfToken: res.locals.csrfToken,
    });
});

// Public routes
app.use("/api/v1/auth", authRouter);
app.use(publicNavRouter);

// Protected routes
app.use(authenticateToken, authNavRouter);

// 6. Error Handling Middleware
app.use(errorMiddleware);

// 7. Start Server
const startServer = async () => {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            console.log(`Watt-WATCH API is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();