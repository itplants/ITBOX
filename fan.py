#!/usr/bin/env python
import time
import pigpio as pi

pi1 = pi.pi()

FPIN = 6 
pi1.set_mode(FPIN,pi.OUTPUT)

pi1.write(FPIN,1)

try:
	while True:
		print "input fun ON[1]/OFF[0]" 
		l=raw_input().split()
		power = int(l[0])

		print power 

		pi1.write(FPIN, power)  # set local Pi's GPIO 11 low

except KeyboardInterrupt:
    pass

pi1.write(FPIN,0)
pi1.stop()
