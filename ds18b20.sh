#!/bin/sh
DEVID="28-0000086eeab1"

cat /sys/bus/w1/devices/$DEVID/w1_slave \
     | perl -e 'while(<stdin>){ if(/t=([-0-9]+)/){print $1/1000,"\n";} }'
