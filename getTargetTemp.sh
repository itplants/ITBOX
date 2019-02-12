#!/bin/sh

/usr/bin/sudo /usr/bin/tail /home/coder/coder-dist/coder-base/data/tempController.log |grep targetTemp|/usr/bin/awk '{print substr(substr($4,12),0)}'|/usr/bin/awk '{gsub("\]","",$1);print $0}'
