#!/usr/bin/env python
import sys
argvs=sys.argv
if( len(argvs) == 1 ):
	f = open('/home/coder/coder-dist/coder-base/config/saveTempController.txt.sample', 'r')
	v = f.read()
	f.close()
	print v
