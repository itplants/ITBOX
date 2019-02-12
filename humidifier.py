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


HUMIDITER = 17
RANGE = 1000
FREQ = 100


print len(args)

if len(args) == 1:
	print("humidifier.py pwm[0-1000]")
	print("PWM ",pi1.get_PWM_dutycycle(HUMIDITER)),     # get level of dick's GPIO 17
	sys.exit()

try:
	power = int(args[1])
except:
	sys.exit()

try:
	pi1.set_PWM_range(HUMIDITER, RANGE)
	pi1.set_PWM_frequency(HUMIDITER, FREQ)
except:
	sys.exit()

#print "Max Power is ", pi1.get_PWM_range(HUMIDITER)

try:
	pi1.set_PWM_dutycycle(HUMIDITER,power)
	print("PWM ",pi1.get_PWM_dutycycle(HUMIDITER)),     # get level of dick's GPIO 11
except:
	print("PWM ",power),  

