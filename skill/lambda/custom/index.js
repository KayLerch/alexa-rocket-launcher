'use strict';
var Alexa = require("alexa-sdk");
var AWS = require('aws-sdk');
var constants = require('./constants');
var Sync = require('sync');

const languageStrings = {
    'en-GB': {
        'translation': {
            happyNewYear: 'Happy new Year!',
            whichRocket: 'Sure. Which one?',
            whichRocketReprompt: 'Give me the number of the rocket that should be launched.',
            help: 'This skill launches real new year rockets. Do you wanna start now?',
            helpReprompt: 'Say yes, to launch a rocket.',
            ok: 'ok',
            didNotUnderstand: 'Sorry, I did not understand you. Please try again.',
            errorOccured: 'Sorry, an error occured. Please try again.'
        }
    },
    'en-US': {
        'translation': {
            happyNewYear: 'Happy new Year!',
            whichRocket: 'Sure. Which one?',
            whichRocketReprompt: 'Give me the number of the rocket that should be launched.',
            help: 'This skill launches real new year rockets. Do you wanna start now?',
            helpReprompt: 'Say yes, to launch a rocket.',
            ok: 'ok',
            didNotUnderstand: 'Sorry, I did not understand you. Please try again.',
            errorOccured: 'Sorry, an error occured. Please try again.'
        }
    },
    'en-IN': {
        'translation': {
            happyNewYear: 'Happy new Year!',
            whichRocket: 'Sure. Which one?',
            whichRocketReprompt: 'Give me the number of the rocket that should be launched.',
            help: 'This skill launches real new year rockets. Do you wanna start now?',
            helpReprompt: 'Say yes, to launch a rocket.',
            ok: 'ok',
            didNotUnderstand: 'Sorry, I did not understand you. Please try again.',
            errorOccured: 'Sorry, an error occured. Please try again.'
        }
    },
    'en-CA': {
        'translation': {
            happyNewYear: 'Happy new Year!',
            whichRocket: 'Sure. Which one?',
            whichRocketReprompt: 'Give me the number of the rocket that should be launched.',
            help: 'This skill launches real new year rockets. Do you wanna start now?',
            helpReprompt: 'Say yes, to launch a rocket.',
            ok: 'ok',
            didNotUnderstand: 'Sorry, I did not understand you. Please try again.',
            errorOccured: 'Sorry, an error occured. Please try again.'
        }
    },
    'en-AU': {
        'translation': {
            happyNewYear: 'Happy new Year!',
            whichRocket: 'Sure. Which one?',
            whichRocketReprompt: 'Give me the number of the rocket that should be launched.',
            help: 'This skill launches real new year rockets. Do you wanna start now?',
            helpReprompt: 'Say yes, to launch a rocket.',
            ok: 'ok',
            didNotUnderstand: 'Sorry, I did not understand you. Please try again.',
            errorOccured: 'Sorry, an error occured. Please try again.'
        }
    },
    'de-DE': {
        'translation': {
            happyNewYear: 'Frohes Neues!',
            whichRocket: 'Alles klar. Welche?',
            whichRocketReprompt: 'Gib mir die Nummern der Raketen, die ich starten soll.',
            help: 'Dieser Skill lässt echte Silvester-Raketen starten. Möchtest du beginnen?',
            helpReprompt: 'Sage ja, um eine Rakete zu starten',
            ok: 'ok',
            didNotUnderstand: 'Entschuldigung, das habe ich nicht verstanden. Bitte probiere es erneut.',
            errorOccured: 'Entschuldigung, ein Fehler ist aufgetreten. Bitte probiere es erneut.'
        }
    },
};

exports.handler = function(event, context) {
    var alexa = Alexa.handler(event, context);
    //alexa.appId = constants.appId;
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', this.t('whichRocket'), this.t('whichRocketReprompt'));
    },
    'LaunchRocket' : function () {
        var rockets = constants.rockets;

        var targetedRockets = [];
        // check all of the four slots for a number value being equal to one of the rocket ids
        if (rockets[this.event.request.intent.slots.AMAZON_NUMBER.value]) {
            // save the referenced rocket for being targeted to launch
            targetedRockets.push(this.event.request.intent.slots.AMAZON_NUMBER.value);
        }
        if (rockets[this.event.request.intent.slots.AMAZON_NUMBER_A.value]) {
            targetedRockets.push(this.event.request.intent.slots.AMAZON_NUMBER_A.value);
        }
        if (rockets[this.event.request.intent.slots.AMAZON_NUMBER_B.value]) {
            targetedRockets.push(this.event.request.intent.slots.AMAZON_NUMBER_B.value);
        }
        if (rockets[this.event.request.intent.slots.AMAZON_NUMBER_C.value]) {
            targetedRockets.push(this.event.request.intent.slots.AMAZON_NUMBER_C.value);
        }

        // if there's a at least one existing rocket being targeted
        if (targetedRockets.length > 0) {
            var rocketStates = [];
            // determine launch state of each rocket based on being targeted or not
            Object.keys(rockets).forEach(function (rocketId) {
                // e.g. "rocketA" : "true"
                rocketStates.push('"' + rockets[rocketId] + '" : "' + targetedRockets.includes(rocketId) + '"');
            });
            // prepare parameters to update AWS IoT shadow state of RaspberryPi
            var params = {
                // join individual rocket states and set as desired state
                payload: '{ "state" : { "desired" : { ' + rocketStates.join(',') + "}}}",
                thingName: constants.iotThing
            };
            // instantiate AWS IoT Data client
            var iotdata = new AWS.IotData({
                endpoint: constants.iotEndpoint 
            });         
            
            var handler = this;
            // try update shadow with desired rocket states
            iotdata.updateThingShadow(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    // errr, something went wrong
                    handler.emit(':tell', handler.t('errorOccured'));
                } else {
                    console.log(data);
                    // confirm rocket states are populated to AWS IoT
                    handler.emit(':tell', handler.t('ok') + '. ' + handler.t('happyNewYear'));
                }
            });
        } else {
            // no existing rocket has been referenced in the voice command. ask for it
            this.emit(':ask', this.t('whichRocket'), this.t('whichRocketReprompt'));
        }
    },
    'SessionEndedRequest' : function() {
    },
    'AMAZON.YesIntent' : function() {
        this.emit('LaunchRequest');
    },
    'AMAZON.HelpIntent' : function() {
        this.response.speak(this.t('help')).listen(this.t('helpReprompt'));
        this.emit(':responseReady');
    },
    'AMAZON.NoIntent' : function() {
        this.emit('AMAZON.StopIntent');
    },
    'AMAZON.CancelIntent' : function() {
        this.emit('AMAZON.StopIntent');
    },
    'AMAZON.StopIntent' : function() {
        this.emit(':tell', this.t('ok'));
    },
    'Unhandled' : function() {
        this.response.speak(this.t('didNotUnderstand'));
    }
};
