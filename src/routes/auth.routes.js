import { Router } from "express";
import {
    requestPasswordChange,
    resetPassword,
    sendEmailForPasswordChange,
    signinController,
    signinPostController,
    signoutController,
    signUpController,
    signUpPostController,
    updatePassword
} from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.get("/signup", signUpController);
authRouter.post("/signup", signUpPostController);
authRouter.get("/signin", signinController);
authRouter.post("/signin", signinPostController);
authRouter.post("/signout", signoutController);
authRouter.get("/account-creation-success", (req, res) => {
    res.render("accountcreationsuccess", { title: "Account Creation Success", csrfToken: res.locals.csrfToken });
});

authRouter.get("/reset", requestPasswordChange);
authRouter.post("/reset", sendEmailForPasswordChange);

authRouter.get("/reset/:token", resetPassword);
authRouter.post("/reset/:token", updatePassword);

export { authRouter };