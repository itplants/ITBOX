#!/usr/bin/python
# coding: utf-8
import sys
import os
import wget
from datetime import datetime

url = 'http://192.168.1.52'
wget.download(url)

date=datetime.now().strftime("%Y/%m/%d %H:%M:%S")
date2=datetime.now().strftime("%Y-%m-%d_%H_")
f=open('download.wget','r')

moist=[0,1,2,3,4,5,6,7,8,9,10]
i=0
rSW=0

for row in f:
    try:
    	s=row.strip()
    except:
        sys.exit()

    #print s 
    if rSW==1:
	moist[i]=float(s)
    	#print 'No.',i,'Moist ',moist[i]
	i+=1 
    if s.find('Moist') == 0:
	rSW=1
    else:
	rSW=0 

f.close()
os.remove('download.wget')

try:
    fo=open('/mnt/data/measuredMoistData'+date2+'.csv','a') 
except:
    fo=open('/mnt/data/measuredMoistData'+date2+'.csv','a') 

n=i
fo.write(date);

for i in range(n):
    fo.write(','+str(moist[i]))
fo.write('\n')
  
fo.close()

import datetime
now=datetime.datetime.now()
today=now.day

ys=now-datetime.timedelta(days=1)

y=ys.year
m=ys.month
if m<10:
    m='0'+str(m)
else:
    m=str(m)
d=ys.day
if d <10:
    d='0'+str(d)
else:
    d=str(d)
y=str(y)
m=str(m)

fyesterday='/mnt/data/measuredMoistData'+y+'-'+m+'-'+d+'_23_.csv'
#print fyesterday

if os.path.exists(fyesterday):
    ofile = '/mnt/data/measuredMoistData'+y+'-'+m+'-'+d+'.csv'
    fo=open(ofile,'w')

    # merge
    for i in range(24):
        n = i
        if i < 10:
                n = '0'+str(i)
        else:
                n=str(n)
        file = '/mnt/data/measuredMoistData'+y+'-'+m+'-'+d+'_'+n+'_.csv'
        ####
        try:
                print 'open ',file,
                fr=open(file,'r');
        except:
                print ' error'
                pass
        ####
        try:
                print 'read ',file,
                rdata=fr.read()
                fr.close()
        except:
                print ' not found'
                pass
        ###
        try:
                #print rdata
                print 'write ',ofile,
                fo.write(rdata)
                print ' removed.'
                os.remove(file)
        except:
                print ' error'
                pass
        ###
    fo.close()
