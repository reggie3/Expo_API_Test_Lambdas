'use strict';
var util = require('util');    // util enables deep looks into an object

console.log('Loading function');
const facebookClientSecret = process.env.facebookClientSecret;
const facebookAppID = process.env.facebookAppID;


exports.handler = (event, context, callback) => {
    console.log(util.inspect(event, { showHidden: true, depth: null }));

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
    //console.log("access token = ", token);
    // Call oauth provider, crack jwt token, etc.
    // In this example, the token is treated as the status for simplicity.
    switch (auth.service) {
        case 'google':
            let googleVerificationResults = verifyGoogleToken(auth);
            console.log('********************');
            console.log({googleVerificationResults});
            break;
        case 'facebook':
            let facebookVerificationResults = verifyFacebookToken(auth);
            console.log('********************');
            console.log({facebookVerificationResults});
            break;
        default:
            callback(null, generatePolicy('user', 'Deny', event.methodArn));
            break;

    }
    /*switch (token.toLowerCase()) {
        case 'allow':
            callback(null, generatePolicy('user', 'Allow', event.methodArn));
            break;
        case 'deny':
            callback(null, generatePolicy('user', 'Deny', event.methodArn));
            break;
        case 'unauthorized':
            callback("Unauthorized");   // Return a 401 Unauthorized response
            break;
        default:
            callback("Error: Invalid token");
    }*/
};

let verifyFacebookToken = (auth) => {
    fetch(`https://graph.facebook.com/debug_token?
     input_token=${auth.accessToken}
     &access_token=${auth.accessToken}`, {
            method: 'GET'
        })
        .then((response) => {
            return response.json();
        })
        .then((json) => {
            console.log('***** verifyFacebookToken response ***');
            console.log({json});
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

}

let verifyGoogleToken = (auth) => {
fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?
     &access_token=${auth.accessToken}`, {
            method: 'POST'
        })
        .then((response) => {
            return response.json();
        })
        .then((json) => {
            console.log('***** verifyGoogleToken response ***');
            console.log({json});
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