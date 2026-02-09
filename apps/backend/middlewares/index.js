const authJwt = require('./auth.middleware');
const verifySignUp = require('./verifySignup.middleware');

module.exports = {
    authJwt,
    verifySignUp
};