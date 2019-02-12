#!/usr/bin/env python

import sys
import re
import numpy as np

filename ='tempController.log'
#print (len(sys.argv))
if(len(sys.argv)==2):
	filename=sys.argv[1]

if(filename[0] != '/'):
	f = open('/home/coder/coder-dist/coder-base/data/'+filename)
else:
	f = open(filename)
#f = open('log.log')
text = f.read() 
f.close()
text = text.replace('=',' ')
lines1 = text.split('\n')

#for line in lines1:
#    print line
#print

#print(re.search('currentTemp=',lines1))

date=np.array([])
temp=np.array([])
pwm=np.array([])
dir=np.array([])
bme280=np.array([])
lux=np.array([])
cons=np.array([])
ds18b20=np.array([])
tmp=np.array([])

startcol=False
datain=False

for line in lines1:
    tmp=np.append(tmp,line[:])

    if line.find('--------') >= 0:
	startcol=True
	datein=False

    if line.find('20') >= 0 and startcol==True and datein==False:
	date=np.append(date,line[:])
	datein=True

    if line.find('currentTemp') >= 0:
	temp=np.append(temp,line[:])

    if line.find('PWM') >= 0:
	pwm=np.append(pwm,line[:])

    if line.find('hot') >= 0:
	dir=np.append(dir,line[:])

    if line.find('cool') >= 0:
	dir=np.append(dir,line[:])

    if line.find('BME280') >= 0:
	bme280=np.append(bme280,line[:])

    if line.find('currentLux') >= 0:
	lux=np.append(lux,line[:])

    if line.find('DS18B20') >= 0:
	ds18b20=np.append(ds18b20,line[:])

    if line.find('Tcondensation') >= 0:
	cons=np.append(cons,line[:])
	startcol=False

#for i in range(0,len(tmp)):
#	print tmp[i]

for i in range(0,len(temp)-1):
#    print date[i+1]+' '+temp[i]+' '+pwm[i]+' '+bme280[i]+' '+lux[i]+' '+cons[i]+' '+ds18b20[i]
    #print bme2801[i].split(' ')
    d = bme280[i].split(' ')
    p = pwm[i].split(' ')
    dr=0.0
    if dir[i].split(' ')[2]=='hot':
	dr = 1.0
    else:
	dr = -1.0
    #print dir1[i].split(' ')[2]+' '+'dr '+str(dr)

    g = ds18b20[i].split(' ')
    t = cons[i].split(' ')
    # date  temp hum press pwm dir constration AH 
    print date[i+1]+','+d[5]+','+d[3]+','+d[7]+','+ str(dr*float(p[1])/10.0)+','+g[1]+','+t[5]+','+t[3]


