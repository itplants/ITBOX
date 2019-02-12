#!/usr/bin/python

import subprocess
from datetime import datetime
from time import sleep 
import sys, os
import numpy as np

#sudo systemctl start tempController
def tempController(com):
    command = '/usr/bin/sudo /bin/systemctl '+ com+ ' tempController'
    #print(command)
    proc = subprocess.Popen(
        command,
        shell  = True,
        stdin  = subprocess.PIPE,
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE) 

    stdout_data, stderr_data = proc.communicate()
    return stdout_data 

def peltier(dir,power):
    command = '/home/pi/src/ITBOX/peltier.py '+str(dir)+' '+str(power)
    #print(command)
    proc = subprocess.Popen(
        command,
        shell  = True,
        stdin  = subprocess.PIPE,
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE) 

    stdout_data, stderr_data = proc.communicate()
    return stdout_data 

def BME280():
    command = '/home/pi/src/ITBOX/BME280.sh'
    #print(command)
    proc = subprocess.Popen(
        command,
        shell  = True,
        stdin  = subprocess.PIPE,
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE) 

    stdout_data, stderr_data = proc.communicate()
    return stdout_data

if __name__ == '__main__':
    argvs = sys.argv
    argc = len(argvs)
    data=[]
    outputFileName='/home/pi/src/ITBOX/stepResponse.csv'
    monitorFileName='/home/coder/coder-dist/coder-base/stepResponseMonitor.csv'

    while True:
        try:
            currentTemp=float(BME280())
            print('currentTemp = ',currentTemp)
            break;
        except:
            pass
  
    for i in range(argc):
        if argvs[i]=='-f':
            outputFileName=argvs[i+1]
        if argvs[i]=='-t':
            currentTemp=argvs[i+1]

    fd = open(outputFileName,'w')
    fd2 = open(monitorFileName,'w')

    tempController('stop')
#
    peltier(1000, 0)

# temp-1
    temp=float(BME280())-currentTemp
    while temp > -1.0:
        time=datetime.now().strftime("%Y/%m/%d %H:%M:%S")
        temp=float(BME280())-currentTemp
        text = str(time)+','+str(temp)
        print(text)
        fd2.write(time+','+str(temp)+'\n')
        fd2.flush()
        sleep(1)

# temp+1 #
    temp=float(BME280())-currentTemp+1
    peltier(1000,1)
    while temp < 1.0:
        time=datetime.now().strftime("%Y/%m/%d %H:%M:%S")
        temp=float(BME280())-currentTemp
        text = str(time)+','+str(temp)
        print(text)
        data.append(temp)
        fd2.write(time+','+str(temp)+'\n')
        fd2.flush()
        #os.sync()
        sleep(1)
    
    min = 100000
    imin = 0
# find minmum point
    for i in range(len(data)):
        if data[i] < min:
            min=data[i]
            imin = i
    data = data[imin:]

    max = -100000
    imax = 0
# find minmum point
    for i in range(len(data)):
        if data[i] > max:
            max=data[i]
            imax = i
    K = max

# print data
    for i in range(len(data)):
        data[i] -= min
        #print(str(i)+','+str(data[i]))

# find 1.264 point
    icenter=0
    for i in range(len(data)):
        if data[i] >= K*0.6132:
            print('center = ',i,data[i])
            icenter=i
            break
# LSM
    N = 20
    #N = 10
    if icenter < 20:
        N = icenter
        print('Error too small icenter ',icenter)

    x = range(icenter,icenter+N)
    y = data[icenter:icenter+N]
    b, a = np.polyfit(x, y, 1)
    print('a='+str(a)+' b='+str(b))
    L = -a/b
    T = icenter-L

# calc Kp,Ki,Kd
    KL = K*L
    Kp = 0.6*T/KL*1000.0
    Ki = 0.6/KL
    Kd = 0.3*T/K
    print('overshoot  0%  Kp '+str(Kp)+' Ki '+str(Ki)+' Kd '+str(Kd) )
    fd2.write('overshoot,0%,Kp,'+str(Kp)+',Ki,'+str(Ki)+',Kd,'+str(Kd)+'\n' )
    fd2.flush()
    #os.sync()

    KL = K*L
    Kp = 0.95*T/KL*1000.0
    Ki = 0.7/KL
    Kd = 0.447*T/K
    print('overshoot 20%  Kp '+str(Kp)+' Ki '+str(Ki)+' Kd '+str(Kd) )
    fd2.write('overshoot,20%,Kp,'+str(Kp)+',Ki,'+str(Ki)+',Kd,'+str(Kd)+'\n' )
    fd2.flush()
    #os.sync()

# current temp
    temp=float(BME280())-currentTemp
    peltier(1000,0)
    i=0
    while temp > 0.0:
        time=datetime.now().strftime("%Y/%m/%d %H:%M:%S")
        temp=float(BME280())-currentTemp
        text = str(time)+','+str(temp)
        print(text)
        fd2.write(time+','+str(temp)+'\n')
        fd2.flush()
        #os.sync()
        i+=1
        if i > 600:
            break
        sleep(1)

# write to file
    buf = ''
    for i in range(len(data)):
        buf += str(i)+','+str(data[i])+'\n'
    fd.write(buf)
    fd.close()
    fd2.close()

    peltier(0,0)
    tempController('start')
