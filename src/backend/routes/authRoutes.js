const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET_TEMP = process.env.JWT_SECRET_TEMP;

const auth = function (req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({msg: 'No token, authorization denied'});

    try {
        const decoded = jwt.verify(token, JWT_SECRET_TEMP);
        if (decoded.exp < Date.now() / 1000) {
            return res.status(401).json({msg: 'Token has expired'});
        }
        req.user = {
            id: decoded.user.id,

            publicAddress: decoded.user.publicAddress
        };
        next();
    } catch (err) {
        res.status(401).json({msg: 'Token is not valid'});
    }
};

router.get('/token', auth, (req, res) => {
    console.log("req.cookies.token");
    console.log(req.cookies.token);
    res.json({token: req.cookies.token});
});

// router.use(function (req, res, next) {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];
//     if (!token) return res.status(401).json({msg: 'No token, authorization denied'});
//
//     try {
//         const decoded = jwt.verify(token, JWT_SECRET_TEMP);
//         if (decoded.exp < Date.now() / 1000) {
//             return res.status(401).json({msg: 'Token has expired'});
//         }
//         req.user = {
//             id: decoded.user.id,
//             publicAddress: decoded.user.publicAddress
//         };
//         console.log(req.user);
//         next();
//     } catch (err) {
//         res.status(401).json({msg: 'Token is not valid'});
//     }
// });


router.get('/verifyToken', function (req, res) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({msg: 'No token, authorization denied'});

    try {
        jwt.verify(token, JWT_SECRET_TEMP);
        res.json({valid: true});
    } catch (err) {
        res.json({valid: false});
    }
});

router.post('/logout', auth, (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

router.use(auth);
module.exports = router;