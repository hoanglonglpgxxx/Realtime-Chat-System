const authJwt = require('./auth.middleware');
const verifySignUp = require('./verify-signup.middleware');

module.exports = {
    authJwt,
    verifySignUp
};