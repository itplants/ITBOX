#!/usr/bin/env python

import os
import sys
import glob
from time import sleep
from datetime import datetime as dt
from numpy import *

os.system('modprobe w1-gpio')

base_dir = '/sys/bus/w1/devices/'
device_folder = glob.glob(base_dir + '28*')
device_file=[0,1,2,3,4,5,6]

now= str(dt.now())

try:
    for i in [0,len(device_folder)-1]:
	device_file[i] = device_folder[i] + '/w1_slave'
except:
    print(now+' 28-devideError 0.0 deg  28-devideError 0.0 deg')
    #print('can not find devices');
    sys.exit()

def read_temp_raw(i):
    f = open(device_file[i], 'r')
    lines = f.readlines()
    f.close()
    return lines

def read_temp(i):
    if i > (len(device_folder)-1):
        return 0;

    lines = read_temp_raw(i)
    while lines[0].strip()[-3:] != 'YES':
        sleep(0.2)
        lines = read_temp_raw(i)
    equals_pos = lines[1].find('t=')
    if equals_pos != -1:
        temp_string = lines[1][equals_pos + 2:]
        temp_c = float(temp_string) / 1000.0
        return temp_c

try:

    print(now),
    for i in range(0,len(device_folder)):
        print(device_folder[i].replace(base_dir,'')+' '+str(read_temp(i))+' deg '),

    if len(device_folder) == 1:
	print(device_folder[0].replace(base_dir,'')+' '+str(read_temp(0))+' deg '),
    print('')

except KeyboardInterrupt:
    pass
except:
# 2018/09/08 06:59:38 28-02119177b613 23.937 deg  28-02119177b613 23.937 deg  
    print(now+' 28-devideError 0.0 deg  28-devideError 0.0 deg')
    #print('unexcept error ',sys.exc_info()[0])
