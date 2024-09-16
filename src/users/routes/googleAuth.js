const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const axios = require('axios');
const { UserAccount: User } = require('../data/models/user-model'); // مدل کاربر در پایگاه داده
const { log } = require('winston');
const { generateJwtToken } = require('../../utils');

const router = express.Router();

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: '210424230900-h413ecac421uf5jsfv6lbck89e3kbtnt.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'http://localhost:5173/'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ username: profile.id });
        if (!user) {
            user = new User({
                username: profile.id,
                full_name: profile.displayName,
                email: profile.emails[0].value,
                phone: '-1',
                password: Math.random().toString(36).slice(-8) // رمز عبور تصادفی برای کاربر جدید
            });
            await user.save();
        }

        console.log(50);
        done(null, user);
    } catch (error) {
        console.log(55);

        done(error, null);
    }
}));

passport.initialize();

// Route برای ورود با Google
router.post('/googleAuth', async (req, res) => {
    const { token } = req.body;

    try {
        // بررسی اعتبار توکن جیمیل با استفاده از Google API
        const { data } = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
        console.log('Google token data:', data); // چاپ اطلاعات دریافتی از Google

        // بررسی اینکه آیا کاربر وجود دارد یا خیر
        let user = await User.findOne({ username: data.sub });
        if (!user) {
            // اگر کاربر وجود ندارد، آن را ایجاد کنید
            user = new User({
                username: data.sub,
                full_name: data.displayName,
                email: data.email,
                phone: '-1',
                password: Math.random().toString(36).slice(-8) // رمز عبور تصادفی برای کاربر جدید
            });
            await user.save();
        }

        // پاسخ موفقیت آمیز
        const bearer_token_data = await user.getBearerTokenData();
        const refresh_token_data = await user.getRefreshTokenData();
        res.json({
            data: {
                message: "you're logged into your account",
                bearer_token: generateJwtToken(bearer_token_data),
                refresh_token: generateJwtToken(refresh_token_data, true)
            },
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phone: '-1'
            },
            needsProfileCompletion: false // تنظیم این به true در صورت نیاز به تکمیل پروفایل
        });
    } catch (error) {
        console.error('Internal server error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
});

module.exports = {
    router
};
