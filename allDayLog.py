#!/usr/bin/env python
# coding: Shift_JIS

import glob
import os
from subprocess import Popen, PIPE

files = glob.glob('data/*-23_00.log')
 
for file in files:
    fname = file.replace('data/tempController','')
    fname = fname.replace('_00.log','')
    print file, fname, 
    p = Popen(["./oneDayLog.js", fname], stdout=PIPE)
    p.wait()

    recogname = 'data/tempController'+fname.replace('-23','')+'.csv'
    recog = glob.glob(recogname)
    print recog

    delfiles = glob.glob('data/tempController'+fname.replace('-23','')+'*.log')
    for df in delfiles:
    	print "del ",df 
	os.remove(df)

