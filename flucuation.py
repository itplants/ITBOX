#!/usr/bin/python

import random
import time

def one_over_fnoise():
    t = random.random() # initial value
    while True:
        if 0 < t < 0.5:
            tt = t + 2 * t**2
        elif 0.5 <= t < 1:
            tt = t - 2 * (1 - t)**2
        else:
            assert False
        yield tt
        t = tt

n=0
for x in one_over_fnoise():
    if int(x*100) < 10 or int(x*100) > 90:
        continue

    print(int(x*100))
    n += 1
    #if n > 512:
    #    break
