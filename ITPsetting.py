#!/usr/bin/python

import subprocess
import sys

readSW=False
readSWLamp=False
readSWDuty=False
readSWPump=False

ITPno=1

def sendcom(com):
    command = '/usr/bin/sudo /home/coder/coder-dist/coder-base/sudo_scripts/sendcom '+str(ITPno)+' -e '+com
    #command = '/usr/bin/sudo /usr/local/bin/sendcom '+str(ITPno)+' -e '+com

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
    ans=sendcom('f').replace('\n','')
    print('readLight1 '+ans)
    ln=int(ans.split(' ')[-1])
    #print('readLight2 '+ln)

    for i in range(ln):
        ans=sendcom('W'+str(i)).replace('\n','')
        ans=ans.split(' ')
        #print(i,ans)
        Light.append({'LightStartTime':ans[-2],'LightContTime':ans[-1]})
    return ln, Light

def readDuty():
    Duty=[]
    # duty n
    dn=int(sendcom('n').split(' ')[-1])
    #print('dn='+str(dn))
    for i in range(dn):
        ans=sendcom('Y'+str(i)).replace('\n','')
        ans=ans.replace('?%','')
        ans=ans.split(' ')
        Duty.append({'PTime':ans[-2], 'PWM':ans[-1]})
    return dn, Duty

def readPump():
    Pump=[]
    PumpWorkingTime=0
    # pump n
    #print('ln='+sendcom('f'))
    pn=int(sendcom('g').replace('\n','').split(' ')[-1])
    for i in range(pn):
        ans=sendcom('X'+str(i)).replace('\n','')
        ans=ans.split(' ')
        #print(i,ans)
        Pump.append({'PumpStartTime':ans[-1]})
        #print(i,Pump[i])

    # pump working time
    pw=int(sendcom('U').replace('\n','').split(' ')[-1])
    #print('pumpWorkingTime='+str(pw))
    PumpWorkingTime=pw
    #print 'PumpWorkingTime=',PumpWorkingTime
    return pn,Pump,PumpWorkingTime

def readSerial():
    # itplanter serial no 
    itpNum=int(sendcom('Z').replace('\n','').split(' ')[-1])
    #print 'itpNum=',itpNum
    return itpNum

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

    '''
    # light n
    #print('ln='+sendcom('f').replace('\n',''))
    ln=int(sendcom('f').replace('\n','').split(' ')[-1])
    #print('ln='+str(ln))
    for i in range(ln):
        ans=sendcom('W'+str(i)).replace('\n','')
        ans=ans.split(' ')
        #print(i,ans)
        Light.append({'LightStartTime':ans[-2],'LightContTime':ans[-1]})
        #print(i,Light[i])

    # duty n
    dn=int(sendcom('n').replace('\n','').split(' ')[-1])
    #print('dn='+str(dn))
    for i in range(dn):
        ans=sendcom('Y'+str(i)).replace('\n','')
        ans=ans.replace('?%','')
        ans=ans.split(' ')
        Duty.append({'PTime':ans[-2], 'PWM':ans[-1]})
        #print(i,Duty[i])

    # pump n
    #print('ln='+sendcom('f'))
    pn=int(sendcom('g').replace('\n','').split(' ')[-1])
    for i in range(pn):
        ans=sendcom('X'+str(i)).replace('\n','')
        ans=ans.split(' ')[-1]
        #print(i,ans)
        Pump.append({'PumpStartTime':ans})
        #print(i,Pump[i])

    # pump working time
    pw=int(sendcom('U').replace('\n','').split(' ')[-1])
    #print('pumpWorkingTime='+str(pw))
    PumpWorkingTime=pw
    #print 'PumpWorkingTime=',PumpWorkingTime

    # itplanter serial no 
    itpNum=sendcom('Z').replace('\n','')
    #print 'itpNum=',itpNum
    '''

    return  Light, Duty, Pump, PumpWorkingTime, itpNum


if __name__ == '__main__':
    argvs = sys.argv
    argc = len(argvs)
    ans=''

    #print('argc=',argc)
    #print('argvs=',argvs)

    i = 1
    while  i < argc:
        #print('i=',i,'argvs=',argvs[i],' argc=',argc)

        if argvs[i]=='-No': 
            ITPno=int(argvs[i+1])
            i += 2
            continue

        if argvs[i]=='-r': 
            readSW=True
            readSWLamp=True
            readSWDuty=True
            readSWPump=True
            i += 1
            #print('ii=',i)
            continue

        if argvs[i]=='-rl': 
            readSW=True
            readSWLamp=True
            i += 1
            #print('ii=',i)
            continue

        if argvs[i]=='-rd': 
            readSW=True
            readSWDuty=True
            i += 1
            #print('ii=',i)
            continue

        if argvs[i]=='-rp': 
            readSW=True
            readSWPump=True
            i += 1
            #print('ii=',i)
            continue

        if argvs[i]=='-A': 
            ans=sendcom('A').replace('\n','')
            print(ans.split(' ')[-1])
            i += 1
            continue

        if argvs[i]=='-F': 
            ans=sendcom('F').replace('\n','')
            print(ans.split(' ')[-1])
            i += 1
            continue

        # pump work time
        if argvs[i]=='-pw': 
            PumpWorkingTime=argvs[i+1]
            ans=sendcom('U'+argvs[i+1]).replace('\n','').split(' ')
            print(ans[-1:])
            i += 2
            continue

        if argvs[i].find('-U')>=0: 
            #print(argvs[i])
            ans=sendcom(argvs[i].replace('-','')).replace('\n','')
            print(ans)
            PumpWorkingTime=argvs[i].replace('-U','')
            i += 1
            continue

        # pump  -P TIME
        if argvs[i].find('-P') >=0 : 
            if len(argvs[i])>=3:
                ans=sendcom(argvs[i].replace('-P','X')).replace('\n','')
                print(ans.split(' ')[-1])
            i += 1
            continue

        if argvs[i].find('-X') >=0 : 
            if len(argvs[i])>=3:
                ans=sendcom(argvs[i][1]).replace('\n','')
                ans=ans.split(' ')[-1:]
                print(ans)
            i += 1
            continue

        #
        if argvs[i].find('-%') >=0 : 
            ans=sendcom('%').replace('\n','')
            ans=ans.split(' ')[-2:]
            print(ans)
            i += 1
            continue

        # duty  -D TIME PWM 
        if argvs[i].find('-D') >=0 : 
            if len(argvs[i])>=3:
                cmd=argvs[i].replace('-D','Y')
                #print('Duty cmd=',cmd)
                ans=sendcom(cmd).replace('\n','')
                ans=ans.replace('?%','').split(' ')[-2:]
                print(ans)
            i += 1
            continue

        if argvs[i].find('-Y') >=0 : 
            if len(argvs[i])>=3:
                cmd=argvs[i].replace('-Y','W')
                ans=sendcom(cmd).replace('\n','')
                ans=ans.replace('?%','').split(' ')[-3:]
                print(ans)
            i += 1
            continue

        # duty  -L TIME CONT 
        if argvs[i].find('-L') >=0 : 
            if len(argvs[i])>=3:
                cmd=argvs[i].replace('-L','W')
                ans=sendcom(cmd).replace('\n','')
                ans=ans.split(' ')[-3:]
                print(ans)
            i += 1
            continue

        # duty  -H PWM 
        if argvs[i].find('-H') >=0 : 
            ans=sendcom('H'+argvs[i+1]).replace('\n','')
            print(ans[-1])
            i += 2
            continue

        if argvs[i].find('-W') >=0 : 
            ##print('argvs='+argvs[i])
            if len(argvs[i])>=3:
                cmd=argvs[i].replace('-W','W')
                ans=sendcom(cmd).replace('\n','')
                ans=ans[-1]
                print(ans)
            i += 1
            continue

        if argvs[i].find('-Z') >=0 : 
            ans=sendcom('Z').replace('\n','')
            ans=split(' ')
            print(ans[-1])
            i += 1 
            continue

        if argvs[i].find('-ln')>=0 :
            if i+1 < len(argvs):
                if argvs[i+1].find('-') >= 0:
                    ans=sendcom( 'f' ).replace('\n','')
                    i += 1
                else:
                    ans=sendcom( 'f'+argvs[i+1] ).replace('\n','')
                    i += 2
            else:
                ans=sendcom('f').replace('\n','')
                i += 1

            #ans=ans.split('\n')[1].split(' ')
            print(ans[-1:])
            continue

        if argvs[i].find('-f')>=0 :
            ans=sendcom( argvs[i].replace('-','') ).replace('\n','')
            ans=ans.split(' ')[-1]
            print(ans)
            i += 1 
            continue

        if argvs[i].find('-g')>=0 :
                ans=sendcom( argvs[i].replace('-','') ).replace('\n','')
                ans=ans.split(' ')[-1]
                print(ans)
                i += 1
                continue

        if argvs[i].find('-pn')>=0 :
            if i+1 < len(argvs):
                if argvs[i+1].find('-') >= 0:
                    ans=sendcom( 'g' ).replace('\n','')
                    ans=ans.split(' ')[-1]
                    print(ans)
                    i += 1
                    continue
                else:
                    ans=sendcom( 'g'+argvs[i+1] ).replace('\n','')
                    ans=ans.split(' ')[-1]
                    print(ans)
                    i += 2
                    continue
            else:
                ans=sendcom('g').replace('\n','')
                ans=ans.split(' ')[-1]
                print(ans)
                i += 1
                continue

        if argvs[i].find('-dn')>=0 :
            if i+1 < len(argvs):
                if argvs[i+1].find('-') >= 0:
                    ans=sendcom( 'n' ).replace('\n','')
                    ans=ans.split(' ')[-1]
                    print(ans)
                    i += 1
                    continue
                else:
                    ans=sendcom( 'n'+argvs[i+1] ).replace('\n','')
                    ans=ans.split(' ')[-1]
                    print(ans)
                    i += 2
                    continue
            else:
                ans=sendcom('n').replace('\n','')
                ans=ans.split(' ')[-1]
                print(ans)
                i += 1
                continue

        if argvs[i].find('-n')>=0 :
                ans=sendcom( argvs[i].replace('-','') ).replace('\n','')
                ans=ans.split(' ')[-1]
                print(ans)
                i += 1
                continue


        if argvs[i]=='-h' or argvs[i]=='-help': 
            print(argvs[0]+' -No '+str(ITPno)+' -ln lightNum -L[n],lightTime,lightCont -dn dutyNum -D[n],pwmTime,pwm -pn pumpNum -P[n],pupmTime -pw PumpWorkTime  -r  -h')
            sys.exit(0)
         
      
    Light=[]
    Duty=[]
    Pump=[]
    PumpWorkingTime=0
    itpNum=0

    if readSW:
        if readSWLamp == True:
            ln, Light=readLight()
            print(Light)


        if readSWDuty == True:
            dn, Duty=readDuty()
            print(Duty)

        if readSWPump == True:
            pn,Pump,PumpWorkingTime=readPump()
            print(Pump)
            print('pumpWorkingTime='+str(PumpWorkingTime))

        itpNum=readSerial()

        #Light,Duty,Pump,PumpWorkingTime,itpNum=readAll()
        print('itpNum='+str(itpNum))
