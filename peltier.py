#!/usr/bin/env python
import time
import sys
import pigpio as pi

args = sys.argv
#print len(args)

try:
	pi1 = pi.pi()
except:
	sys.exit()

MON = 5
PELTIER = 11
DIR = 9
RANGE = 1000
FREQ = 10
STEP = 1

if len(args) == 1:
	print("peltier.py pwm[0-1000] dir[0/1] ")
	print("PWM ",pi1.get_PWM_dutycycle(PELTIER)),     # get level of dick's GPIO 11
	print(" dir  ",pi1.read(DIR)),     # get level of dick's GPIO 11
	print(" mon  ",pi1.read(MON))     # get level of dick's GPIO 5
	sys.exit()

try:
	pi1.set_mode(MON,pi.INPUT)
	pi1.set_mode(DIR,pi.OUTPUT)
	pi1.set_PWM_range(PELTIER, RANGE)
	pi1.set_PWM_frequency(PELTIER, FREQ)
	pi1.set_PWM_dutycycle(PELTIER, 0)
except:
	sys.exit()

#print "Max Power is ", pi1.get_PWM_range(PELTIER)

try:
	power = int(args[1])
	dir   = int(args[2])
        print('power=',power,' dir=',dir)
except:
	sys.exit()

#####
# inverse dir
#####
'''
if dir == 0:
	dir = 1
else:
  	dir = 0
'''
#####

try:
	pi1.set_PWM_dutycycle(PELTIER,power)
	pi1.write(DIR, dir)  # set local Pi's GPIO 11 low
	print("PWM ",pi1.get_PWM_dutycycle(PELTIER)),     # get level of dick's GPIO 11
	print(" dir  ",pi1.read(DIR)),     # get level of dick's GPIO 11
	print(" mon  ",pi1.read(MON))     # get level of dick's GPIO 5
except:
	print("PWM ",power),  
	print(" dir  ",dir)

