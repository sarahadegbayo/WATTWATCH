
import { Router } from "express";
import { dashboardController } from "../controllers/auth.controller.js";

const authNavRouter = Router();

authNavRouter.get("/community", (req, res) => {
    res.render("community", {
        title: "Community",
        isAuthenticated: !!req.user,
        csrfToken: res.locals.csrfToken,
    });
});

authNavRouter.get("/dashboard", dashboardController);

export { authNavRouter }
