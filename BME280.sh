#!/bin/sh
./BME280.py|awk '{print $6}'
