
import { verifytoken, getUserWithSessionBySessionId, generateAccessToken } from "../Services/Auth.services.js"
import { ACCESS_TOKEN_EXPIRY } from "../Config/constants.js"
// export const VerifyToken = (req, res, next) => {
//     const token = req.cookies.token
//     if (!token) {
//         req.user = null
//         return next()
//     }
//     try {
//         const decoded = verifytoken(token)
//         req.user = decoded
//         next()
//     } catch (err) {
//         req.user = null
//         next()
//     }
    
// }

export const VerifyAuthentication = async (req, res, next) => {
    const accessToken = req.cookies.Access_token
    const refreshToken = req.cookies.Refresh_token
    // console.log("Access Token:", accessToken)
    // console.log("Refresh Token:", refreshToken)
    if (!accessToken && !refreshToken) {
        req.user = null
        return next()
    }
    if(accessToken&&refreshToken){
        try {
            const decoded =  verifytoken(accessToken, 'access')
            // console.log("Decoded Access Token:", decoded)
            // console.log("Decoded Refresh Token:", refreshDecoded)
            req.user = decoded
            return next()
        } catch (err) {
            // console.error("Access token verification failed:", err)
            req.user = null
            return next()
        }
    }
    if(!accessToken&&refreshToken){
        try{
            const sessionID  =  verifytoken(refreshToken, 'refresh').sessionId
            const userSessionData = await getUserWithSessionBySessionId(sessionID)
            if (!userSessionData) {
                req.user = null
                return next()
            }

            const newAccessToken = generateAccessToken({userId: userSessionData.userId, email: userSessionData.email, sessionId: sessionID, isValidEmail: userSessionData.isEmailValid})
            res.cookie('Access_token', newAccessToken, {
                maxAge: ACCESS_TOKEN_EXPIRY,
                httpOnly: true,
            })
            req.user = {userId: userSessionData.userId, email: userSessionData.email, sessionId: sessionID, isEmailValid: userSessionData.isEmailValid}
            // console.log("req.user set to:", req.user)
            return next()
        }
        catch(err){
            // console.error("Error occurred while refreshing access token:", err)

            req.user = null
            return next()
        }
    }
}
