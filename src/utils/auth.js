
const basicAuth = require('basic-auth');
const AuthSchema = require('../models/AuthSchema')
module.exports = async (req, res, next) => {
    const user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        res.sendStatus(401);
        return;
    }
    const result = await AuthSchema.findOne({user:user.name, pass:user.pass})
    console.log(result)
    if (result) {
        next();
    } else {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Failed');
        res.sendStatus(401);
        return;
    }
}