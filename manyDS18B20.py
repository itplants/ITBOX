#!/usr/bin/env python
#
# Read DS18B20 1-wire temp sensors and output Fahrenheit
# 

import os, sys

def find_sensors(basedir):
    return [x for x in os.listdir(basedir) if x.startswith('28')]


def read_temp(sensor):
    with open(sensor + '/w1_slave', "r") as f:
        data = f.readlines()

    if data[0].strip()[-3:] == "YES":
        return [True, float(data[1].split("=")[1])]
    else:
        return [False, 0.0]


def celsius_to_fahrenheit(c):
    return (c * 1.8) + 32.0


if __name__ == "__main__":
    calSW=0
    tmps = [0,1,2,3,4,5,6,7]
    corr = [0,1,2,3,4,5,6,7]
    id = [0,1,2,3,4,5,6,7]

    args = sys.argv
    #print len(args)

    for c in args:
	if c == '-c':
		calSW=1 
	if c == '-h':
		print(args[0]+' -c[caliblation]')
		sys.exit()
	
    if calSW==0:
	f = open('tempCorrection.txt','r')
	i = 0
	for w in f:
		id[i]=w.split(' ')[0]
		corr[i]=float(w.split(' ')[1])
		i += 1

    basedir = '/sys/bus/w1/devices'

    sensors = find_sensors(basedir)

    if not sensors:
        print "No sensors found"
        sys.exit(0)

    sum=0.0
    i = 0
    for s in sensors:
        (ok, temp) = read_temp(basedir + '/' + s)

        if ok:
            tmps[i]=  temp / 1000.0
	    id[i]=s
	    if tmps[i] > 100:
		continue

	    if calSW == 0:
	            tmps[i]=tmps[i]-corr[i]

	    print s,  tmps[i]

	    sum += tmps[i]
	    i += 1
        else:
            print s, ': Sensor not ready for reading'

    n = i
    mean=sum/n
    #print('n=',n,'mean=',mean,'sum=',sum)
    if calSW == 1:
    	i = 0
	f = open('tempCorrection.txt','w')
    	for i in range(n):
	    	if tmps[i] > 100:
			continue

		corr[i]=tmps[i]-mean
        	print(id[i],'correction=',corr[i])
		txt = str(id[i])+' '+str(corr[i])+'\n'
		f.write(txt)
	
