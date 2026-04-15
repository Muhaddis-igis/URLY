import express from 'express'
import {
	loginHandler,
	signupHandler,
	postloginHandler,
	postsignupHandler,
	logoutHandler,
	getForgotPasswordPage,
	postForgotPasswordHandler,
	getResetPasswordPage,
	postResetPasswordHandler,
	googleOAuthStartHandler,
	googleOAuthCallbackHandler,
	verifyEmailTokenHandler
} from '../Controllers/Auth.controller.js'
import {
	validateLoginInput,
	validateSignupInput,
	validateForgotPasswordInput,
	validateResetPasswordInput
} from '../Validator/auth.validator.js'
const Router = express.Router()

Router.route('/login').get(loginHandler).post(validateLoginInput, postloginHandler)
Router.route('/signup').get(signupHandler).post(validateSignupInput, postsignupHandler)
Router.get('/logout', logoutHandler)
Router.route('/forgot-password').get(getForgotPasswordPage).post(validateForgotPasswordInput, postForgotPasswordHandler)
Router.route('/login/forgot-password').get(getForgotPasswordPage).post(validateForgotPasswordInput, postForgotPasswordHandler)
Router.route('/reset-password').get(getResetPasswordPage).post(validateResetPasswordInput, postResetPasswordHandler)
Router.get('/verify-email/:token', verifyEmailTokenHandler)
Router.get('/google', googleOAuthStartHandler)
Router.get('/google/callback', googleOAuthCallbackHandler)
const authRouter = Router
export default authRouter
