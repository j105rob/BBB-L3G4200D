Beagle Bone Black Wireless Gun HID
=====================

This code runs the controls on the gun for the SAND-Matrix demo. It creates a software based IMU from 
an accel and a gyro. It also uses Gizmod to connect up the Nostromo keyad. The BBB then processes the signals
from the sensors and devices then sends them to the SAND-MAtrix Construct over UDP. This is a proof of concept
to demonstrate bringing a physical device into the game construct.

BBB is running Ubuntu built from source, running off the SD card.

uname -a shows Linux arm 3.8.13-bone28 #1 SMP Fri Sep 13 03:12:24 UTC 2013 armv7l armv7l armv7l GNU/Linux

Most resources are documented in the code. This is *NOT* a NodeJS package, nor do I intend it to be. This is currently 
one off demo. Feel free to use the code, fork the repo, or ask questions.

Software
====================
NodeJS
GizmoD


Components
==================
Beagle Bone Black 
L3G4200D Gyro
ADXL345 Accel


TODO:
==================
 - Need to dump the registers at start up for the Gyro and Accel
 - Currently have a lowpass on the accel implemented in code, not sure if the AXDL345 has capability onboard
 
