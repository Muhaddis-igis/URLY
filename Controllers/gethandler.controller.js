import { LoadShortLinks, LoadShortLinkById } from "../Services/Shortener.services.js";
import { getVerificationByTokenAndEmail,verifyUser } from "../Services/EmailVerification.services.js";
import { validateId } from "../Validator/shortener.validator.js";
import { tokenSchema } from "../Validator/shortener.validator.js";



export const getHandler = async (req, res) => {
    try {
        res.render('index.ejs', {
            pageTitle: 'Home | URLly',
            activePage: 'home'
        })
    } catch (err) {
        res.status(500).send("Internal Server Error")
        // console.log(err)
    }
}

export const getDashboardHandler = async (req, res) => {
    if (!req.user) {
        return res.redirect('/login')
    }

    try {
        const links = await LoadShortLinks(req.user.userId);
        res.render('dashboard.ejs', {
            links,
            baseUrl: `${req.protocol}://${req.get('host')}`,
            pageTitle: 'Dashboard | URLly',
            activePage: 'dashboard'
        })
    } catch (err) {
        res.status(500).send("Internal Server Error")
        // console.log(err)
    }
}
export const getEditHandler = async (req, res) => {
    if (!req.user) {
        return res.redirect('/login')
    }
    try {
        const { data: linkId, error } = validateId(req.params.id);
        if (error) {
            return res.status(400).send("Invalid link ID")
        }
        const link = await LoadShortLinkById(linkId);
        res.render('edit.ejs', {
            link,
            pageTitle: 'Edit Link | URLly',
            activePage: 'dashboard'
        })

    }
    catch (err) {
        res.status(500).send("Internal Server Error")
        // console.log(err)
    }
}



export const verifyEmailHandler = async (req, res) => {
    if (!req.user) {
        return res.redirect('/login')
    }
    return res.render('verify-email.ejs', {
        pageTitle: 'Verify Email | URLly',
        activePage: 'profile'
    })
}



export const verifyEmailToken = async (req, res) => {
  const { token, email } = req.query;
  const parsed = tokenSchema.safeParse({ token, email });

  if (!parsed.success) {
    req.flash('error', 'Invalid verification link.');
    return res.redirect('/login/profile/verify-email');
  }

    const verification = await getVerificationByTokenAndEmail(token, email);
  if (!verification || verification.expiresAt < new Date()) {
    req.flash('error', 'Invalid or expired verification token.');
    return res.redirect('/login/profile/verify-email');
  }

    await verifyUser({ email: verification.email, token: verification.token });

  req.flash('success', 'Your email has been successfully verified!');
  return res.redirect('/login/profile');
};
