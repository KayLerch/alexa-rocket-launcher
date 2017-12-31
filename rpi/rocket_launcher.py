import time
import sys
import json
import logging
import RPi.GPIO as GPIO
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient

# before you run this on your RPi make sure you set AWS credentials in your environment
# e.g. by
# export AWS_ACCESS_KEY_ID=AKIAJXXXXLKAF7LTXXXX
# export AWS_SECRET_ACCESS_KEY=pv4rriZftm6PvEvBw/otRXXXX5p//TYTXXXX9e+m
# the IAM user associated with this credentials need AWS IoT permissions
# follow instructions at: https://github.com/aws/aws-iot-device-sdk-python

# the impulse signature of each of the remote ignition channels A to D
# your ones might differ from the below
# how to: http://www.instructables.com/id/Super-Simple-Raspberry-Pi-433MHz-Home-Automation/
rockets = \
    {
        "rocketA": "1001011011100111000111101",
        "rocketB": "1001011011100111000111011",
        "rocketC": "1001011011100111000111001",
        "rocketD": "1001011011100111000110111"
    }
# the delay between lows and highs sent over GPIO to the RF transmitter is also part of the individual signature
# of the remote being emulated
# your ones might differ from the below
# how to: http://www.instructables.com/id/Super-Simple-Raspberry-Pi-433MHz-Home-Automation/
short_delay = 0.00035
long_delay = 0.001
extended_delay = 0.0096

# number of times the wave string is sent. just to make sure it won't be missed by the remote ignition controls
NUM_ATTEMPTS = 10
# the data pin which is connected to the RF transmitter
TRANSMIT_PIN = 23

# the name of the queue receiving shadow updates. it always looks the same except for the "rpi-rocket-launcher" part
# which needs to be replaced by the name of the thing you created in AWS IoT
updateAcceptedQueue = "$aws/things/rpi-rocket-launcher/shadow/update/accepted"
# give it a unique clientId. anything should work here
myMQTTClient = AWSIoTMQTTClient("rocket-launcher", useWebsocket=True)
# the individual endpoint of your AWS IoT setup in your account. Use AWS CLI to get your endpoint
# see: http://docs.amazonaws.cn/cli/latest/reference/iot/describe-endpoint.html
myMQTTClient.configureEndpoint("your-endpoint-goes-here", 443)
# path to the root certificate you need to upload to your Raspberry Pi. You get it from AWS developer console once you created your thing
myMQTTClient.configureCredentials("cert/root.pem")
# leave the below as is unless you know what you're doing
myMQTTClient.configureOfflinePublishQueueing(-1)  
myMQTTClient.configureDrainingFrequency(2)  
myMQTTClient.configureConnectDisconnectTimeout(10)
myMQTTClient.configureMQTTOperationTimeout(5)

# Configure logging
logger = logging.getLogger("AWSIoTPythonSDK.core")
logger.setLevel(logging.DEBUG)
streamHandler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
streamHandler.setFormatter(formatter)
logger.addHandler(streamHandler)

def on_message(client, userdata, message):
    print("Message received : " + message.topic + " | QoS: " + str(message.qos) + " | Data Received: " + str(message.payload))
    payload = str(message.payload).replace("b'", "", 1).replace("'", "")
    # extract progress from json payload
    payloadJson = json.loads(payload)
    if "state" not in payloadJson:
        print("Payload does not contain state-object.");
        return
    payloadState = payloadJson["state"]

    if "desired" in payloadState: payloadState = payloadState["desired"]

    for rocket in rockets:
        if rocket in payloadState and payloadState[rocket] == "true":
            exec('transmit_code(' + rockets[rocket] + ')')

def transmit_code(code):
    for t in range(NUM_ATTEMPTS):
        for i in str(code):
            if i == '1':
                GPIO.output(TRANSMIT_PIN, 1)
                time.sleep(short_delay)
                GPIO.output(TRANSMIT_PIN, 0)
                time.sleep(long_delay)
            elif i == '0':
                GPIO.output(TRANSMIT_PIN, 1)
                time.sleep(long_delay)
                GPIO.output(TRANSMIT_PIN, 0)
                time.sleep(short_delay)
            else:
                continue
        GPIO.output(TRANSMIT_PIN, 0)
        time.sleep(extended_delay)
    
try:
    # set GPIO pin which is connected to the RF transmitter 
    GPIO.cleanup()
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(TRANSMIT_PIN, GPIO.OUT)
    # connect to AWS IoT using the settings from above
    myMQTTClient.connect()
    # subscribe to updates on thing shadow in AWS IoT
    myMQTTClient.subscribe(updateAcceptedQueue, 1, on_message)
    # loop forever to listen on incoming messages from the queue you subsribed above
    while True: 
        print(".")
        time.sleep(1)
except (KeyboardInterrupt, SystemExit):
    GPIO.cleanup()
    sys.exit()