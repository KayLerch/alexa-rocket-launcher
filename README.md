# **Alexa Rocket Launcher**

This repo contains sources for an IoT project which launches a rocket fireworks via voice with an Alexa skill. It is the world's first voice-enabled rocket launcher and is ready for you to rebuild by following the below instructions. See it live in action on [Youtube](https://youtu.be/_rzY5OAtVLo).

**DISCLAIMER (Please read)**

Please be careful when rebuilding this project as it deals with real fireworks. It is not intended to be used by children. Stick to your local state and country laws concerning fireworks usage and follow the manufacturer's instruction when using the individual hardware components.

## **Hardware setup**

In order to set off firework remotly via Alexa I was using the following components which all can be ordered on the Internet.

- Raspberry Pi 3, Breadboard, Jumper Wires M/M and T-cobbler - you can order each of these components individually or get a starter pack which ships it all [Order here](https://www.amazon.com/dp/B01C6Q4GLE)
- 433 Mhz RF Transmitter and Receiver - [Order here](https://www.amazon.com/dp/B00M2CUALS)
- 4 Cue Firing System - [Order here](https://www.amazon.de/dp/B00H77AYD2)
- 4 Consumer Igniters - Google it
- Alexa-enabled device - choose from the variety of Echo devices sold on Amazon

... and of course some rockets. They are usually on sale before New Year's eve.

![](/img/setup-close.png)

My firing system consists of 2 x 2 RF 433Mhz receiving iginition units. Consumer igniters connect those and the fuse of each rocket. The firing system also comes with a small remote control having four buttons. You won't use the remote to set off the fireworks as the RF transmitter wired to the Raspberry Pi is supposed to do this job. However, you need the remote to sniff the radio wave signature of each of the four RF channels associated with the buttons on the remote.

![](/img/setup-far.png)

## **Software architecture**

This is how it works behind the scenes. 

![](/img/solution-architecture.png)

1) User says e.g. "Alexa, tell my rockets to start number one". The skill is invoked whose sources you can find in the [./skill](./skill) folder of this repo.

2) The skill backend - a Lambda function gets triggered. It handles the command and resolves the "one" given in the slot value to the friendly name "rocketA" (see constants.js file in the skill code). 

3) The Lambda code updates the thing shadow state in AWS IoT - a virtual representation of the Raspberry Pi in the cloud. "rocketA" is assigned with value "true" meaning it should start the corresponding rocket in the hardware backend.

4) A Python script running on a Raspberry Pi subscribed to an MQTT topic of AWS IoT which gets new messages on thing shadow updates. Right after Lambda updates the shadow, a new MQTT messages is received on the Pi. The script resolves the friendly name to a radio wave signature predefined in the [./rpi/rocket-launcher.py](./rpi/rocket-launcher.py) 

5) The Python script sends high and low signals with certain delays to a GPIO pin which is connected to the RF transmitter unit.

6) The RF transmitter exposes radio waves according to the highs and lows it receives over the wire from the Raspberry Pi. This is how it is emulating the remote control shipped with the firing system. 

7) The firing system receives the radio signal and ignites the rocket.

## **How to replicate**

## **Prerequisite**

- all the above-mentioned hardware components
- an __AWS developer account__ to host the Lambda function and set up the IoT thing shadow
- an __Amazon developer account__ to set up the skill
- _ASK CLI_ installed on your local machine
- _AWS CLI_ installed on your local machine

 ## **Instructions**

1) Check out this repo on your local machine.

2) Log in to AWS developer console and go to AWS IoT. Go to _Manage_ and _Create_ a new thing. Name it _rpi-rocket-launcher_. If you choose a different name you need to update its reference in the Python script and the constants.js of the skill code.

3) In AWS IoT go to _Settings_ and copy the _Endpoint_ which is unique to your AWS account. Go to [./rpi/rocket-launcher.py](./rpi/rocket-launcher.py) and paste the endpoint address into `myMQTTClient.configureEndpoint("your-endpoint-goes-here", 443)`

4) Next, go to [./skill/lambda/custom/constants.js](./skill/lambda/custom/constants.js) and paste the endpoint address into `iotEndpoint : 'your-endpoint-goes-here'`

5) In your command shell navigate to [./skill/lambda/custom](./skill/lambda/custom) and `ask deploy`. You need to install and set up the ASK CLI and AWS CLI beforehand.

6) Return to the AWS developer console and go to _AWS IAM_. Go to _Roles_ and try find the newly created IAM role for the skill Lambda function. It should be named similar to _ask-lambda-Rocket-Launcher_. Click on it and hit _Attach policy_. You'll need to add the _AWSIoTDataAccess_ policy. Complete this step.

7) Go to _Users_ and _Create_ a new user. As permission give it _AWSIoTFullAccess_ and choose _Programmatic access_. Save the access id and access secret. You'll need it later on.

8) Log in the the Amazon developer console and try find the freshly created skill called _Rocket launcher_. Click on it and navigate to the locale you'll want to use (e.g. _en-US_). Go to _Test_ and enable testing on a device. Done.

9) Set up your Raspberry Pi and upload everything inside the [./rpi](./rpi) folder of this repo. Set up credentials for the IAM user you created in step 7 as the Python script needs access to AWS IoT. Follow the instructions given as comments in the Python script.

10) In the Python script you'll need to update the RF signatures of each of the channels of your firing system. You got another remote than me and it might differ from what I am using. Getting the signatures is not that easy but well explained [here](http://www.instructables.com/id/Super-Simple-Raspberry-Pi-433MHz-Home-Automation/).

11) On your Pi you need to install the [AWS IoT Device SDK](https://github.com/aws/aws-iot-device-sdk-python) for Python. Follow the instructions on the Github pages to install it. You'll need to connect your Pi to an RF receiver to get the right codes. 

12) Wire an RF Transmitter to your Pi. VCC to 5V, GND to GND, and Data to GPIO 23.

13) Run the Python script on your Pi and check if it connects to AWS IoT. It should subscribe to the update accepted queue of the _rpi-rocket-launcher_ thing you created before. Great, everything is set. Keep it running. It polls for new messages coming from AWS IoT forever.

14) Connect your remote firing system to the rockets using consumer igniters. You should first test without fireworks and check if signals get received on the firing system - most of them indicate via LED.

15) On your Echo device open the skill by saying _"Alexa, start my rockets"_ and give it a _"one"_. You can also give it more than just one number and multiple rockets launch at once.

Have fun!


