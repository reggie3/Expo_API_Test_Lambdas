'use strict';
var util = require('util');    // util enables deep looks into an object
var fetch = require('node-fetch');

console.log('Loading function');
const facebookClientSecret = process.env.facebookClientSecret;
const facebookAppID = process.env.facebookAppID;
const googleOauth2AndroidClientID = process.env.googleOauth2AndroidClientID;
const googleOauth2iOSClientID = process.env.googleOauth2iOSClientID;

exports.handler = (event, context, callback) => {
    // console.log(util.inspect(event, { showHidden: true, depth: null }));

    // use split to parse out the pieces of data in the authentication header
    let authorizationInfo = event.authorizationToken.split("||");
    let auth = {
        service: authorizationInfo[0],
        accessToken: authorizationInfo[1],
        id: authorizationInfo[2],
        email: authorizationInfo[3]
    }

    //console.log(util.inspect(auth, { showHidden: true, depth: null }));
    const token = auth.accessToken;
    console.log("access token = ", token);
    // Call oauth provider, crack jwt token, etc.
    // In this example, the token is treated as the status for simplicity.
    switch (auth.service) {
        case 'google':
            let googleVerificationResults = verifyGoogleToken(auth, callback);
            break;
        case 'facebook':
            let facebookVerificationResults = verifyFacebookToken(auth, callback);
            console.log('********************');
            console.log({ facebookVerificationResults });
            callback(null, generatePolicy('user', 'Allow', event.methodArn));
            break;
        default:
                callback("Error: Invalid authenticatin service");
            break;

    }
};

// based on "Inspecting Access Tokens" from here: https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#checktoken
let verifyFacebookToken = (auth, callback) => {
    return new Promise(function (resolve, reject) {
        fetch(`https://graph.facebook.com/debug_token?input_token=${auth.accessToken}&access_token=${auth.accessToken}`, {
            method: 'GET'
        })
            .then((response) => {
                return response.json();
            })
            .then((json) => {
                console.log('***** verifyFacebookToken response ***');

                if (json.hasOwnProperty('error')) {
                    reject({
                        type: 'error',
                    });
                }
                resolve(resolve({
                    type: 'success',
                }));
            })
            .catch(function (error) {
                console.log('Request failed', error);
                reject({
                    type: 'error',
                    msg: 'failed to verify facebook access token'
                });
            });
    });

}

// based on "OAUTH 2.0 ENDPOINTS" Complete Example from here: https://developers.google.com/identity/protocols/OAuth2UserAgent#validate-access-token
let verifyGoogleToken = (auth, callback) => {
    return new Promise(function (resolve, reject) {
        fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?&access_token=${auth.accessToken}`, {
            method: 'POST'
        })
            .then((response) => {
                return response.json();
            })
            .then((json) => {
                console.log('***** verifyGoogleToken response ***');
                console.log(util.inspect(json, { showHidden: true, depth: null }));
                // from https://developers.google.com/identity/sign-in/web/backend-auth ensure the following items
                // The value of aud in the ID token is equal to one of your app's client IDs. 
                // This check is necessary to prevent ID tokens issued to a malicious app being used to access data about the same user on your app's backend server.
                if ((json.aud !== googleOauth2AndroidClientID) && (json.aud !== googleOauth2iOSClientID)) {
                    callback(null, generatePolicy('user', 'Deny', event.methodArn));
                    resolve({
                        type: 'error',
                        msg: 'aud mismatch'
                    })
                }
                // check to see if the user ID and the sub value match
                else if (json.sub !== auth.id) {
                    callback(null, generatePolicy('user', 'Deny', event.methodArn));
                    resolve({
                        type: 'error',
                        msg: 'ID mismatch'
                    })
                }
                // The expiry time (exp) of the ID token has not passed.
                // if so, get a refresh token
                else if (json.expires_in >= 0) {
                    callback(null, generatePolicy('user', 'Deny', event.methodArn));
                    resolve({
                        type: 'error',
                        msg: 'token expired'
                    })
                }
                else {
                    callback(null, generatePolicy('user', 'Allow', event.methodArn));
                    resolve({
                        type: 'success',
                        msg: 'valid token'
                    })
                }

            })
            .catch(function (error) {
                console.log("in catch +++++++")
                callback(null, generatePolicy('user', 'Deny', event.methodArn));
            });
    });
}

var generatePolicy = function (principalId, effect, resource) {
    var authResponse = {};

    authResponse.principalId = principalId;
    if (effect && resource) {
        var policyDocument = {};
        policyDocument.Version = '2012-10-17'; // default version
        policyDocument.Statement = [];
        var statementOne = {};
        statementOne.Action = 'execute-api:Invoke'; // default action
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }

    // Can optionally return a context object of your choosing.
    authResponse.context = {};
    authResponse.context.stringKey = "stringval";
    authResponse.context.numberKey = 123;
    authResponse.context.booleanKey = true;
    return authResponse;
}