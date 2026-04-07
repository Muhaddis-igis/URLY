import express from 'express'
import { getHandler, getDashboardHandler, getEditHandler,  verifyEmailHandler,verifyEmailToken } from '../Controllers/gethandler.controller.js'
import { postHandler, postUpdateHandler, postVerifyEmailHandler, resendVerificationEmailHandler,verifyNowHandler } from '../Controllers/posthandler.controller.js'
import { redirecter } from '../Controllers/redirecter.controller.js'
import { deleteHandler } from '../Controllers/deletehandler.controller.js'
import { validateDashboardShortlinkInput, validateEditShortlinkInput } from '../Validator/shortener.validator.js'

const Router = express.Router()




Router.get('/', getHandler)
Router.get('/S/:shortcode', redirecter)
Router.delete('/delete/S/:shortcode', deleteHandler)
Router.get('/login/dashboard', getDashboardHandler)
Router.route('/login/dashboard').get(getDashboardHandler).post(validateDashboardShortlinkInput, postHandler)
Router.route('/login/dashboard/edit/:id').get(getEditHandler).post(validateEditShortlinkInput, postUpdateHandler)

Router.post('/login/verify-email', postVerifyEmailHandler)
Router.get('/login/verify-email', verifyEmailHandler)
Router.get('/login/verify-email-token',verifyEmailToken )
Router.get('/login/verify-email/resend', resendVerificationEmailHandler)
Router.post("/login/verify-email-token", verifyNowHandler)

const shortenerRouter = Router
export default shortenerRouter
