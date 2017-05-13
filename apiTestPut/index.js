'use strict';
var util = require('util');    // util enables deep looks into an object


exports.handler = (event, context, callback) => {
    // print out the event object to view what was sent
    console.log(util.inspect(event, { showHidden: true, depth: null }));

    // must respond according to this https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html#api-gateway-simple-proxy-for-lambda-output-format
    // since Lamda Proxy integration was enabled when setting up this method in API Gateway
    callback(null, {"statusCode": 200, "body": "Hello from apiTestPut"});
};