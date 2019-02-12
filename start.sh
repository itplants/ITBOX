#!/bin/sh
if [ $# -eq 1 ]
then
cd /home/pi/src/ITBOX
sudo rm out.log 2>/dev/null
sudo pigpiod 2>/dev/null
sudo touch /mnt/data/tempController.log
sudo ln -s /dev/i2c-1 /dev/i2c-0 2>/dev/null
sudo /home/pi/src/ITBOX/tempController.js $1 
fi

if [ $# -eq 0 ]
then
cd /home/pi/src/ITBOX
sudo rm out.log 2>/dev/null
sudo ln -s /dev/i2c-1 /dev/i2c-0 2>/dev/null
sudo pigpiod 2>/dev/null
sudo touch /mnt/data/tempController.log
sudo chmod 666  /home/coder/coder-dist/coder-base/data/tempController.log
sudo /home/pi/src/ITBOX/tempController.js start
fi
