import express from "express";
import {
    editProfileHandler,
    changePasswordHandler,
    getProfileHandler,
    postEditProfileHandler,
    postChangePasswordHandler,
} from "../Controllers/Profile.controller.js";
import { validateChangePasswordInput } from "../Validator/profile.validator.js";

const Router = express.Router();

Router.route('/login/profile/edit').get(editProfileHandler).post(postEditProfileHandler);
Router
    .route('/login/profile/change-password')
    .get(changePasswordHandler)
    .post(validateChangePasswordInput, postChangePasswordHandler);
Router.route('/login/profile').get(getProfileHandler);

const ProfileRouter = Router;
export default ProfileRouter;
