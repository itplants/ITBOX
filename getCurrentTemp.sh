#!/bin/bash

/usr/bin/sudo /usr/bin/tail /home/coder/coder-dist/coder-base/data/tempController.log |/bin/grep currentTemp|/usr/bin/awk '{print substr($1, 13)}'
