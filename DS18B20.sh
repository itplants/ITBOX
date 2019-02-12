#!/bin/sh
./DS18B20.py|awk '{print $4, $7}'
