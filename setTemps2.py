#!/usr/bin/env python
import sys
argvs=sys.argv
if( len(argvs) == 1 ):
	f = open('/home/coder/coder-dist/coder-base/config/saveTempController.txt', 'r')
	v = f.read()
	f.close()
	print v

if( len(argvs) == 2 ):
	f = open('/home/coder/coder-dist/coder-base/'+sys.argv[1], 'r')
	v = f.read()
	f.close()
	print v
 
if( len(argvs) > 2 ):
	f = open('/home/coder/coder-dist/coder-base/config/saveTempController.txt', 'w')
	f.write(sys.argv[2])
	f.close()
