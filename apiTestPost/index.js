'use strict';
var util = require('util');    // util enables deep looks into an object


exports.handler = (event, context, callback) => {
    // print out the event object to view what was sent
    //console.log(util.inspect(event, { showHidden: true, depth: null }));
    console.log(event.body);
    // must respond according to this https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html#api-gateway-simple-proxy-for-lambda-output-format
    // since Lamda Proxy integration was enabled when setting up this method in API Gateway
    callback(null, {
        // return a status code indicating success or failure
        "statusCode": 200, 
        // body has to be a string
        "body": JSON.stringify({
            msg: "Hello from apiTestPost.  You sent the following object: ",
            received: event.body})
    });
};