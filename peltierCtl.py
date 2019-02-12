#!/usr/bin/python3

import time
import sys
import pigpio as pi
from subprocess import Popen, PIPE

from threading import Timer

class RepeatedTimer(Timer):
  def __init__(self, interval, function, args=[], kwargs={}):
    Timer.__init__(self, interval, self.run, args, kwargs)
    self.thread = None
    self.function = function

  def run(self):
    self.thread = Timer(self.interval, self.run)
    self.thread.start()
    self.function(*self.args, **self.kwargs)

  def cancel(self):
    if self.thread is not None:
      self.thread.cancel()
      self.thread.join()
      del self.thread


args = sys.argv
#print len(args)


def BME280(arg):
  #p =Popen(["./BME280.py","|","awk '{print $6}'", "-s"], stdout=PIPE)
  p =Popen(["./DS18B20.py","-s"], stdout=PIPE)
  while 1:
    c = p.stdout.read(1024)
    if not c:
      break
    c = c.decode('UTF-8')
    print(c)
  p.wait() 

def hello(message):
  hello.counter += 1
  print(message, hello.counter)

hello.counter = 0

from subprocess import check_call

if __name__=='__main__': 
  if len(args) == 1:
    print ("peltier.py pwm[0-1000] dir[0/1] ")
    sys.exit()

  pi1 = pi.pi()

  PELTIER = 11
  DIR =9 
  RANGE = 1000
  FREQ = 10
  STEP = 1

  FPIN = 6
  pi1.set_mode(FPIN,pi.OUTPUT)

#pi1.write(FPIN,1)

  pi1.set_PWM_range(PELTIER, RANGE)
  pi1.set_PWM_frequency(PELTIER, FREQ)
  pi1.set_PWM_dutycycle(PELTIER, 0)

#print "Max Power is ", pi1.get_PWM_range(PELTIER)

  power = int(args[1])
  dir   = int(args[2])

  pi1.set_PWM_dutycycle(PELTIER,power)
  pi1.write(DIR, dir)  # set local Pi's GPIO 11 low
  print("PWM ",pi1.get_PWM_dutycycle(PELTIER),)    # get level of dick's GPIO 11
  print(" dir  ",pi1.read(DIR))    # get level of dick's GPIO 11

#x = input('> ')

  t = RepeatedTimer(5, BME280, ["hello"])
  #t = RepeatedTimer(0.5, hello, ["Hello"])
  t.start()
#  time.sleep(5)
#  t.cancel()
#  print("Done.")


