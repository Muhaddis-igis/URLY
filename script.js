import express from 'express'
import dotenv from 'dotenv'
import shortenerRouter from './routes/shortener.routes.js'
import authRouter from './routes/Auth.routes.js'
import profileRouter from './routes/Profile.routes.js'

import cookieParser from 'cookie-parser'
import { VerifyAuthentication } from './Middlewares/Verifytoken.middleware.js'
import session from 'express-session'
import flash from 'connect-flash'
import requestIP from 'request-ip'
import ProfileRouter from './routes/Profile.routes.js'

const app = express()
const port = process.env.PORT || 3000

dotenv.config()
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: true,
    saveUninitialized: false
}))
app.use(requestIP.mw())
app.use(flash())
app.use(VerifyAuthentication)
app.use((req, res, next) => {
    res.locals.user = req.user || null
    res.locals.flash = {
        error: req.flash('error'),
        success: req.flash('success')
    }
    next()
})
app.use(authRouter)
app.use(shortenerRouter)
app.use(ProfileRouter)

app.listen(port, () => {
    // console.log(`Server is running on port ${port}`)
})
