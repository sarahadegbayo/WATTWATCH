import { Router } from "express";

const publicNavRouter = Router();

publicNavRouter.get("/outagemap", (req, res) => {
    res.render("outagemap", {
        title: "Outage Map",
        csrfToken: res.locals.csrfToken,
        isAuthenticated: !!req.user,
    });
});

publicNavRouter.get("/reportoutage", (req, res) => {
    res.render("reportoutage", {
        title: "Report Outage",
        isAuthenticated: !!req.user,
        csrfToken: res.locals.csrfToken,
    });
});

export { publicNavRouter };