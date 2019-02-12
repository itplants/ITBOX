#!/usr/bin/python

import subprocess
import sys
import time
from datetime import datetime

ITPno=1

def sendcom(com):
    command = '/usr/bin/sudo /usr/local/bin/sendcom '+str(ITPno)+' -e '+com
    #print(command)
    proc = subprocess.Popen(
        command,
        shell  = True,
        stdin  = subprocess.PIPE,
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE) 

    stdout_data, stderr_data = proc.communicate()
    #print( stdout_data )
    return stdout_data 

def readLight():
    Light=[]
    # light n
    #print('ln='+sendcom('f'))
    ln=int(sendcom('f').split('\n')[1].split(' ')[1])
    #print('ln='+str(ln))
    for i in range(ln):
        ans=sendcom('W'+str(i))
        ans=ans.split('\n')[1].split(' ')
        #print(i,ans)
        Light.append({'LightStartTime':int(ans[3]),'LightContTime':int(ans[4])})
    return ln, Light

def readDuty():
    Duty=[]
    # duty n
    dn=int(sendcom('n').split('\n')[1].split(' ')[1])
    #print('dn='+str(dn))
    for i in range(dn):
        ans=sendcom('Y'+str(i))
        ans=ans.replace('?%','')
        ans=ans.split('\n')[1].split(' ')
        Duty.append({'PTime':ans[3], 'PWM':ans[4]})
    return dn, Duty

def writeDuty(Duty):
    # duty n
    dn=len(Duty)
    ans=sendcom('n'+str(dn))
    print('dn='+str(dn))
    for i in range(dn):
        # Duty[i]='startTime,PWM'
        ans=sendcom('Y'+str(i)+','+str(Duty[i]))
        ans=ans.replace('?%','')
        print(str(i)+','+ans)

def readPump():
    Pump=[]
    PumpWorkingTime=0
    # pump n
    #print('ln='+sendcom('f'))
    pn=int(sendcom('g').split('\n')[1].split(' ')[1])
    for i in range(pn):
        ans=sendcom('X'+str(i))
        ans=ans.split('\n')[1].split(' ')
        #print(i,ans)
        Pump.append({'PumpStartTime':ans[3]})
        #print(i,Pump[i])

    # pump working time
    pw=int(sendcom('U').split('\n')[1].split(' ')[1])
    #print('pumpWorkingTime='+str(pw))
    PumpWorkingTime=pw
    #print 'PumpWorkingTime=',PumpWorkingTime
    return pn,Pump,PumpWorkingTime

def readSerial():
    # itplanter serial no 
    itpNum=sendcom('Z').split('\n')[1]
    #print 'itpNum=',itpNum
    return itpNum

def readClock():
    clock=sendcom('G').split('\n')[1]
    return clock

def readAll():
    itpNum=0

    if readSWLamp == True:
        ln, Light=readLight()


    if readSWDuty == True:
        dn, Duty=readDuty()
        print('Duty ',Duty)

    if readSWPump == True:
        pn,Pump,PumpWorkingTime=readPump()

    itpNum=readSerial()

    return  Light, Duty, Pump, PumpWorkingTime, itpNum

import threading

from datetime import datetime
import random

def one_over_noise(randomSW):
    t = random.random() # initial value
    while True:
        if randomSW==False:
            if 0 < t < 0.5:
                tt = t + 2 * t**2
            elif 0.5 <= t < 1:
                tt = t - 2 * (1 - t)**2
            else:
                assert False
            yield tt
            t = tt
        else:
            yield t

if __name__ == '__main__':
    argvs = sys.argv
    argc = len(argvs)

    freq=1
    randomSW=False 
    if argc < 2:
        for i in range(argc): 
            if argvs[i]=='-f':
                freq=int(argvs[i+1])
                continue
            if argvs[i]=='-r':
                randomSW=True 
                continue
            if argvs[i]=='-n':
                randomSW=False 
                continue
            if argvs[i]=='-h':
                print( argvs[0]+' -f freq -r random -n 1/f')
                sys.exit(1)
    
    #
    # read Light ON time and Light OFF time
    #
    # 
    Ln, light=readLight()

    if Ln <= 1:
        print('shortperiodControl.py');
        print('Set Light Shedule more than 1.');
        sys.exit(1)

    #light={'LightStartTime':ans[3],'LightContTime':ans[4]})
    minstart=60*24*10
    sumcont=0
    for i in range(Ln):
        start=light[i]['LightStartTime']
        cont=light[i]['LightContTime']
        if start < minstart:
            minstart=start
        sumcont += cont

    #nowtime=datetime.now().strftime("%H:%M")
    print('start time ='+str(int(minstart/60))+':'+str(int(minstart%60)))
    print('stop  time ='+str(int(minstart+sumcont)/60)+':'+str(int(minstart+sumcont)%60) )
    
    for x in one_over_noise(randomSW):
        # sleep Light OFF period
        #time00=datetime.now().strftime("%H:%M")
        time00=readClock()
        if time00 == '':
            continue
        print('time='+time00)
        time0=time00.split(' ')
        # h 11 m 48 s 0 mm 708
        time1 = int(time0[1])*60+int(time0[3]) 
        if time1 < minstart or  time1 > minstart+sumcont:

        # Light OFF
            Duty=['0,'+str(power)]
            print(Duty)
            writeDuty(Duty)
            ans=sendcom('p')
            ans=sendcom('H0')
            time.sleep(freq*60)
            continue

        #print(x)
        power=int(100*x)
        if power >= 10 and power <= 90:
            Duty=['0,'+str(power)]
            print(Duty)
            writeDuty(Duty)
            ans=sendcom('p')
            ans=sendcom('H'+str(power))
            time.sleep(freq*60)
