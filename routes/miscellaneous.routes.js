import { Router } from "express";
import { contactUs } from "../controllers/miscellaneous.controller.js";
// import { authorizedRoles, isLoggedIn } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/contact").post(contactUs);
// router.route('/admin/status/users')
// .get(isLoggedIn, authorizedRoles('ADMIN'), userStatus);

export default router