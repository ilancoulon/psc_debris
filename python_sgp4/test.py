#!/usr/bin/env python2
# -*- coding: utf-8 -*-
"""
Created on Wed Oct 17 16:10:03 2018

@author: ilan
"""

from sgp4.earth_gravity import wgs72
from sgp4.io import twoline2rv

line1 = ('1 25544U 98067A   04236.56031392  .00020137  00000-0  16538-3 0  9993')
line2 = ('2 25544  51.6335 344.7760 0007976 126.2523 325.9359 15.70406856328906')

satellite = twoline2rv(line1, line2, wgs72)

# Je mets ici une date au pif :
position, velocity = satellite.propagate(2006, 6, 29, 12, 50, 19)

#print(satellite.error)    # nonzero on error

#print(satellite.error_message)

print(position)
print(velocity)
