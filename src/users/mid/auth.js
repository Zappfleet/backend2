const { verifyJwtToken } = require("../../utils");

function authenticate(req, res, next) {
    const token = req.header("Authorization");
    if (token == null) return next();
    const auth = verifyJwtToken(token);
    if (auth != null) {
        req.auth = auth;
    }
    next();
}

function restrict(req, res, next) {
    if (req.auth == null) {
        return res.status(403).json({ error: "you are not authorized" });
    }
    next();
}

module.exports.authenticate = authenticate;
module.exports.restrict = restrict;