import {
    deleteSession,
    existsUser,
    issueAuthTokensForUser,
    setAuthCookies,
    markEmailAsVerified,
    createUnverifiedUserAndEnqueueVerification,
    verifyEmailTokenAndConsume
} from '../Services/Auth.services.js'
import argon2 from 'argon2'
import zxcvbn from 'zxcvbn'
import crypto from 'crypto'
import { Google, generateCodeVerifier, generateState } from 'arctic'
import {
    createPasswordResetTokenForUser,
    generatePasswordResetToken,
    getValidPasswordResetToken,
    resetPasswordByToken,
    sendPasswordResetEmail
} from '../Services/PasswordReset.services.js'

const GOOGLE_OAUTH_STATE_COOKIE = 'google_oauth_state'
const GOOGLE_OAUTH_CODE_VERIFIER_COOKIE = 'google_oauth_code_verifier'

const getGoogleOAuthClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
        return null
    }

    return new Google(clientId, clientSecret, redirectUri)
}

export const loginHandler = async (req, res) => {
    if (req.user) {
        return res.redirect('/login/dashboard')
    }
    res.render('auth/login.ejs', {
        pageTitle: 'Login | URLly',
        activePage: 'login'
    })
}
export const signupHandler = async (req, res) => {
    if (req.user) {
        return res.redirect('/login/dashboard')
    }

    res.render('auth/signup.ejs', {
        pageTitle: 'Register | URLly',
        activePage: 'signup'
    })
}

export const postloginHandler = async (req, res) => {
    if (req.user) {
        return res.redirect('/login/dashboard')
    }

    const { email, password } = req.body
    const isuser = await existsUser(email)

    if (!isuser) {
        req.flash('error', 'Invalid user or password')
        return res.redirect('/login')
    }

    const ismatch = await argon2.verify(isuser.password, password)
    if (!ismatch) {
        req.flash('error', 'Invalid user or password')
        return res.redirect('/login')
    }

    if (!Boolean(isuser.isEmailValid)) {
        req.flash('error', 'Verify your email first')
        return res.redirect('/login')
    }

    const { accessToken, refreshToken } = await issueAuthTokensForUser(isuser, {
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || ''
    })
    
    setAuthCookies(res, { accessToken, refreshToken })
    return res.redirect('/login/dashboard')
}

export const postsignupHandler = async (req, res) => {
    const { name, email, password } = req.body

    try {
        const user = await existsUser(email)
        if (user) {
            req.flash('error', 'User already exists')
            return res.redirect('/signup')
        }

        const hashedPassword = await argon2.hash(password)
        await createUnverifiedUserAndEnqueueVerification({
            name,
            email,
            password: hashedPassword
        })

        req.flash('success', 'Account created. Please verify your email first, then login.')
        return res.redirect('/login')
    } catch (err) {
        console.error('Error during signup:', err)
        req.flash('error', 'Could not complete signup right now. Please try again.')
        return res.redirect('/signup')
    }
}

export const verifyEmailTokenHandler = async (req, res) => {
    const token = String(req.params.token || '').trim()

    if (!token) {
        req.flash('error', 'Invalid or expired verification link')
        return res.redirect('/login')
    }

    try {
        const result = await verifyEmailTokenAndConsume({ token })

        if (!result.verified) {
            req.flash('error', 'Invalid or expired verification link')
            return res.redirect('/login')
        }

        req.flash('success', 'Email verified successfully. You can now login.')
        return res.redirect('/login')
    } catch (err) {
        console.error('Error verifying email token:', err)
        req.flash('error', 'Something went wrong while verifying your email')
        return res.redirect('/login')
    }
}

export const logoutHandler = async (req, res) => {
    await deleteSession(req.user.sessionId)
    res.clearCookie('Access_token')
    res.clearCookie('Refresh_token')
    res.redirect('/login')
}
export const getForgotPasswordPage = async (req, res) => {
    try{

        if (req.user) {
            return res.redirect('/login/dashboard')
        }

        return res.render('auth/forgot-password.ejs', {
            pageTitle: 'Forgot Password | URLly',
            activePage: 'forgot-password'
        })
        
    }catch(err){
        console.error("Error rendering forgot password page:", err)
        res.status(500).send("Internal Server Error")
    }
}

export const postForgotPasswordHandler = async (req, res) => {
    const { email } = req.body

    try {
        const user = await existsUser(email)

        if (user) {
            const token = generatePasswordResetToken()
            await createPasswordResetTokenForUser({ userId: user.id, token })
            await sendPasswordResetEmail({ email: user.email, token })
        }

        // Do not reveal whether the email exists.
        req.flash('success', 'If your email exists in our system, a password reset link has been sent.')
        return res.redirect('/forgot-password')
    } catch (err) {
        console.error('Error handling forgot password:', err)
        req.flash('error', 'Something went wrong while processing your request')
        return res.redirect('/forgot-password')
    }
}

export const getResetPasswordPage = async (req, res) => {
    const token = String(req.query.token || '').trim()
    const email = String(req.query.email || '').trim()

    if (!token || !email) {
        req.flash('error', 'Invalid or expired password reset link')
        return res.redirect('/forgot-password')
    }

    try {
        const validToken = await getValidPasswordResetToken({ token, email })
        if (!validToken) {
            req.flash('error', 'Invalid or expired password reset link')
            return res.redirect('/forgot-password')
        }

        return res.render('auth/reset-password.ejs', {
            pageTitle: 'Reset Password | URLly',
            activePage: 'login',
            token,
            email
        })
    } catch (err) {
        console.error('Error rendering reset password page:', err)
        req.flash('error', 'Something went wrong while processing your request')
        return res.redirect('/forgot-password')
    }
}

export const postResetPasswordHandler = async (req, res) => {
    const { token, email, password } = req.body

    try {
        const strength = zxcvbn(password)
        if (strength.score < 3) {
            req.flash('error', 'Password is too weak')
            return res.redirect(`/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
        }

        const nextPasswordHash = await argon2.hash(password)
        const result = await resetPasswordByToken({ token, email, nextPasswordHash })

        if (!result.updated) {
            req.flash('error', 'Invalid or expired password reset link')
            return res.redirect('/forgot-password')
        }

        res.clearCookie('Access_token')
        res.clearCookie('Refresh_token')
        req.flash('success', 'Your password has been reset. Please login with your new password.')
        return res.redirect('/login')
    } catch (err) {
        console.error('Error resetting password:', err)
        req.flash('error', 'Something went wrong while processing your request')
        return res.redirect('/forgot-password')
    }
}

export const googleOAuthStartHandler = async (req, res) => {
    if (req.user) {
        return res.redirect('/login/dashboard')
    }

    try {
        const google = getGoogleOAuthClient()
        if (!google) {
            req.flash('error', 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.')
            return res.redirect('/login')
        }

        const state = generateState()
        const codeVerifier = generateCodeVerifier()
        const scopes = ['openid', 'profile', 'email']
        const authorizationURL = google.createAuthorizationURL(state, codeVerifier, scopes)

        res.cookie(GOOGLE_OAUTH_STATE_COOKIE, state, {
            maxAge: 10 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })
        res.cookie(GOOGLE_OAUTH_CODE_VERIFIER_COOKIE, codeVerifier, {
            maxAge: 10 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })

        return res.redirect(authorizationURL.toString())
    } catch (err) {
        console.error('Error starting Google OAuth flow:', err)
        req.flash('error', 'Unable to start Google login right now. Please try again.')
        return res.redirect('/login')
    }
}

export const googleOAuthCallbackHandler = async (req, res) => {
    if (req.user) {
        return res.redirect('/login/dashboard')
    }

    const code = String(req.query.code || '').trim()
    const state = String(req.query.state || '').trim()
    const storedState = String(req.cookies[GOOGLE_OAUTH_STATE_COOKIE] || '').trim()
    const storedCodeVerifier = String(req.cookies[GOOGLE_OAUTH_CODE_VERIFIER_COOKIE] || '').trim()

    res.clearCookie(GOOGLE_OAUTH_STATE_COOKIE)
    res.clearCookie(GOOGLE_OAUTH_CODE_VERIFIER_COOKIE)

    if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
        req.flash('error', 'Invalid Google login state. Please try again.')
        return res.redirect('/login')
    }

    try {
        const google = getGoogleOAuthClient()
        if (!google) {
            req.flash('error', 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.')
            return res.redirect('/login')
        }

        const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier)
        const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${tokens.accessToken()}`
            }
        })

        if (!googleUserResponse.ok) {
            req.flash('error', 'Could not fetch your Google profile. Please try again.')
            return res.redirect('/login')
        }

        const googleUser = await googleUserResponse.json()
        const email = String(googleUser.email || '').trim().toLowerCase()
        const name = String(googleUser.name || '').trim() || 'Google User'
        const isGoogleEmailVerified = Boolean(googleUser.email_verified)

        if (!email) {
            req.flash('error', 'Google account is missing required profile details.')
            return res.redirect('/login')
        }

        let user = await existsUser(email)

        if (!user) {
            const randomPassword = crypto.randomBytes(32).toString('hex')
            const randomPasswordHash = await argon2.hash(randomPassword)
            const insertedUsers = await saveUser(name, email, randomPasswordHash)

            user = {
                id: insertedUsers[0].id,
                email,
                isEmailValid: isGoogleEmailVerified ? 1 : 0
            }
        }

        if (isGoogleEmailVerified && !user.isEmailValid) {
            await markEmailAsVerified(user.id)
            user.isEmailValid = 1
        }

        const { accessToken, refreshToken } = await issueAuthTokensForUser(user, {
            userAgent: req.headers['user-agent'] || '',
            ipAddress: req.ip || ''
        })

        setAuthCookies(res, { accessToken, refreshToken })
        return res.redirect('/login/dashboard')
    } catch (err) {
        console.error('Error during Google OAuth callback:', err)
        req.flash('error', 'Google login failed. Please try again.')
        return res.redirect('/login')
    }
}