#!/bin/sh

#echo $#

if [ $# -eq 0 ]; then
cat /home/coder/coder-dist/coder-base/config/saveTempController.txt
  exit 1
fi

if [ $# -eq 1 ]; then
tmp=$1
time="0:0:0"
fi

if [ $# -eq 2 ]; then
tmp=$1
time=$2
fi

sudo echo -e "targetTemp "$tmp" start "$time > /home/coder/coder-dist/coder-base/config/saveTempController.txt
#echo "targetTemp " $tmp " start " $time > ./tmp.txt

exit 0
