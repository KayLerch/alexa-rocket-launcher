"use strict";

module.exports = Object.freeze({
    appId : '',
    // individual endpoint of your AWS IoT setup
    // get your endpoint by using AWS CLI 
    // see: http://docs.amazonaws.cn/cli/latest/reference/iot/describe-endpoint.html
    iotEndpoint : 'your-endpoint-goes-here',
    // the name of the thing your created in AWS IoT
    iotThing: 'rpi-rocket-launcher',
    // keys are the numbers said by users to the skill (e.g. "rocket number 1")
    // values are friendly names Python script is using on the Raspberry (see ../../rpi/rocket_launcher.py)
    rockets: {
        '2' : 'rocketA',
        '0' : 'rocketB',
        '1' : 'rocketC',
        '8' : 'rocketD'
    }
});