#!/usr/bin/env python
import time
import sys
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)

args = sys.argv

if len(args) == 1:
	print("peltier.py pwm[0-1000] dir[0/1] ")
	sys.exit()

PELTIER = 11
DIR = 9
RANGE = 1000
FREQ = 10
STEP = 1

GPIO.setup(DIR, GPIO.OUT)
pwm=GPIO.PWM(PELTIER, FREQ)

	pi1.set_PWM_range(PELTIER, RANGE)
	pi1.set_PWM_dutycycle(PELTIER, 0)

#print "Max Power is ", pi1.get_PWM_range(PELTIER)

try:
	power = int(args[1])
	dir   = int(args[2])
except:
	sys.exit()

#####
# inverse dir
#####
if dir == 0:
	dir = 1
else:
  	dir = 0
#####

pwm.start(power)
GPIO.output(DIR, dir)
