#!/usr/bin/python
import time
import sys
import numpy as np

if __name__ == '__main__':
    argvs = sys.argv
    argc = len(argvs)

    fd = open('stepResponse.csv','r')
    buf=fd.read()
    buf=buf.split('\n')
    buf.pop()
    data=[]
    for d in buf:
        #print('d=',d,'split=',float(d.split(',')[1]))
        data.append(float(d.split(',')[1]))
    #print(data)

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
        print(str(i)+','+str(data[i]))

# find 1.264 point
    icenter=0
    for i in range(len(data)):
        if data[i] >= K*0.6132:
            print(i,data[i])
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

    KL = K*L
    Kp = 0.95*T/KL*1000.0
    Ki = 0.7/KL
    Kd = 0.447*T/K
    print('overshoot 20%  Kp '+str(Kp)+' Ki '+str(Ki)+' Kd '+str(Kd) )

