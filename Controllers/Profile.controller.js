import { validateProfileData} from "../Validator/profile.validator.js";
import { updateUserName, loadProfileSummaryByUserId,updatePassword } from "../Services/profile.services.js";
import { findByUserId } from "../Services/Auth.services.js";

import argon2 from 'argon2'
import zxcvbn from "zxcvbn";

export const getProfileHandler = async (req, res) => {
    if (!req.user) {
        return res.redirect('/login')
    }

    try {
        const profileSummary = await loadProfileSummaryByUserId(req.user.userId)
        if (!profileSummary) {
            return res.status(404).send('User not found')
        }

        const lastActive = profileSummary.lastActive || null
        const memberSince = profileSummary.createdAt || null
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileSummary.name || 'User')}&background=0b7285&color=ffffff&rounded=true&size=160`

        res.render('profile.ejs', {
            pageTitle: 'Profile | URLly',
            activePage: 'profile',
            profile: {
                name: profileSummary.name || 'User',
                email: profileSummary.email || req.user.email,
                totalClicks: profileSummary.totalLinks,
                lastActive,
                memberSince,
                emailVerified: Boolean(profileSummary.isEmailValid),
                avatarUrl
            }
        })
    } catch (err) {
        console.log(err)
        res.status(500).send("Internal Server Error")
    }
}

export const editProfileHandler = async (req, res) => {
    if (!req.user) {
        return res.redirect('/login')
    }


    return res.render('edit-profile.ejs', {
        pageTitle: 'Edit Profile | URLly',
        activePage: 'profile'
    })
}
export const postEditProfileHandler = async (req, res) => {
    if (!req.user) {
        return res.redirect('/login')
    }
    console.log(req.body)
    const {data,error} = validateProfileData(req.body)
    if (error) {
        req.flash('error', error)
        return res.redirect('/login/profile/edit')
    }
    const newName = data.name
    try {
        await updateUserName({userId: req.user.userId, newName})
        req.flash('success', 'Profile updated successfully')
        return res.redirect('/login/profile')}
        catch (err) {
            console.log(err)
            req.flash('error', 'Something went wrong while updating your profile')
            return res.redirect('/login/profile/edit')
        }
}
export const changePasswordHandler = async (req, res) => {
    if (!req.user) {
        return res.redirect('/login')
    }
    try {
    res.render('change-password.ejs', {
        pageTitle: 'Change Password | URLly',
        activePage: 'profile'
    })} catch (err) {
        console.log(err)
        res.status(500).send("Internal Server Error")
    }

}

export const postChangePasswordHandler = async (req, res) => {
    if (!req.user) {
        return res.redirect('/login')
    }

    try {
 
   

        const { currentPassword, updatedPassword } = req.body;

        // 2. Strength check
        const strength = zxcvbn(updatedPassword);
        if (strength.score < 3) {
            req.flash('error', 'Password is too weak');
            return res.redirect('/login/profile/change-password');
        }

        // 3. Get user
        const user = await findByUserId(req.user.userId);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/login/profile/change-password');
        }

        // 4. Verify current password
        const isMatch = await argon2.verify(user.password, currentPassword);
        if (!isMatch) {
            req.flash('error', 'Current password is incorrect');
            return res.redirect('/login/profile/change-password');
        }

        // 5. Hash new password
        const hashed = await argon2.hash(updatedPassword);

        // 6. Update password
        await updatePassword({ userId: req.user.userId, password: hashed });

 

        req.flash('success', 'Password updated successfully');
        return res.redirect('/login/profile');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong while processing your request');
        return res.redirect('/login/profile/change-password');
    }
};