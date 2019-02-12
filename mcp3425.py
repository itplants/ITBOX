#!/usr/bin/env python
# -*- coding: utf-8 -*-

#
# photo sensor value of BME280 environment sheeld
# max is 1.0V  ---> dark
# min is 0.0V  ---> 5000 lux?
#

import smbus
import time
bus = smbus.SMBus(1)
bus.write_i2c_block_data(0x68, 0b10001000, [0x00])
time.sleep(1)

data = bus.read_i2c_block_data(0x68, 0x00, 2)
raw  = data[0] << 8 | data[1]

if raw > 32767:
   raw -= 65535
vol = 2.048 / 32767
#print str(raw*vol) + " [V]"
print str(5000*(1.0-raw*vol)) + " Lux"
