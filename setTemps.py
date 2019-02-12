#!/usr/bin/env python
import sys
argvs=sys.argv
if( len(argvs) == 1 ):
	f = open('/home/coder/coder-dist/coder-base/config/saveTempController.txt', 'r')
	v = f.read()
	f.close()
	print v
if( len(argvs) == 2 ):
	f = open(sys.argv[1], 'r')
	v = f.read()
	f.close()
	print v

if( len(argvs) > 3 ):
	#print sys.argv[0]
	#print sys.argv[1]
	#print sys.argv[2]

	i=0
	txt=''
	argv=sys.argv
	for av in argv:
		if i > 1:
			txt += sys.argv[i]+' ';
			if av != 'Ki' and i % 4 == 1:
				txt += '\n'
		i += 1
	f = open('/home/coder/coder-dist/coder-base/config/saveTempController.txt', 'w')
	f.write(txt)
	f.close()

	f = open(argv[1], 'w')
	f.write(txt)
	f.close()
	print argv[1]
	print txt
