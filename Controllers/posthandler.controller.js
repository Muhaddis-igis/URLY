import { SaveShortLinkIfAvailable, updateShortLink} from '../Services/Shortener.services.js'
import {SendVerificationEmail,tokenValidation,verifyUser} from '../Services/EmailVerification.services.js'
import { tokenSchema, validateId, } from '../Validator/shortener.validator.js';



export const postHandler = async (req, res) => {
    try {
        const { url, shortcode } = req.body
        const result = await SaveShortLinkIfAvailable(url, shortcode, req.user.userId);
        if (!result.created) {
            req.flash("error",'Shortcode already exists')
            return res.redirect('/login/dashboard')
        }

        req.flash("success", 'Short link created successfully')
        return res.redirect('/login/dashboard')
    } catch (err) {
        req.flash("error", 'Something went wrong while creating your short link')
        return res.redirect('/login/dashboard')
    }
}
export const postUpdateHandler = async (req, res) => {
    try {
        const { data: id, error } = validateId(req.params.id);
        if (error) {
            return res.status(400).send("Invalid link ID");
        }
        const { originalUrl, shortcode } = req.body;
        await updateShortLink(id, originalUrl, shortcode);
        return res.redirect('/login/dashboard');
        }
        catch (err) {
            // console.log(err)
            res.status(500).send("Internal Server Error")
        }}

export const postVerifyEmailHandler = async (req, res) => {
    if (!req.user || req.user.isEmailValid) {
        return res.redirect('/login')
    }
    try {
        await SendVerificationEmail({ userId: req.user.userId, email: req.user.email })
        return res.redirect('/login/verify-email');
    } catch (err) {
        console.error("Error sending verification email:", err);
        res.status(500).send("Internal Server Error");

    }
}

export const resendVerificationEmailHandler = async (req, res) => {
    if (!req.user) {
        return res.redirect('/login')
    }
    await SendVerificationEmail({ userId: req.user.userId, email: req.user.email })
    req.flash('success', 'A new verification code has been sent (placeholder flow).')
    return res.redirect('/login/profile/verify-email')
}
export const verifyNowHandler = async (req, res) => {
    const {data,error} = tokenSchema.token.safeParse(req.body)
    const token = data?.token
    if (!token) {
        req.flash('error', token.error.issues[0].message)
        return res.redirect('/login/verify-email')
    }
    try {
    const verifiedUser  = await tokenValidation(token)
    if(verifiedUser.token === token){
    await verifyUser({token: token, email: req.user.email})}
    req.flash('success', 'Your email has been successfully verified!')
    return res.redirect('/login/profile')}
    catch (err){
           console.log(err)
        return res.status(500).send("Internal Server Error")
    }
}