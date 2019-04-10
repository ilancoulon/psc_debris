from sgp4.earth_gravity import wgs72
from sgp4.io import twoline2rv
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import axes3d, Axes3D
import numpy as np
from numpy import linalg as LA
import datetime
import wget
import uuid
import urllib2
import urllib
import httplib
import json
line1 = ('1 25544U 98067A   04236.56031392  .00020137  00000-0  16538-3 0  9993')
line2 = ('2 25544  51.6335 344.7760 0007976 126.2523 325.9359 15.70406856328906')



TIME_PRECISION = datetime.timedelta(seconds=30)
DURATION = datetime.timedelta(hours = 1000)



class Debris:
    def __init__(self, line1, line2, dmin=0, velocity=0):
        self.twoline2rv = twoline2rv(line1, line2, wgs72)

        self.tle1 = line1
        self.tle2 = line2
        self.dmin = dmin
        self.velocity = velocity
        self.date = self.twoline2rv.epoch

    def trajectory(self):
        Npoints = DURATION.seconds // TIME_PRECISION.seconds
        t= self.date

        position1, velocity1 = self.twoline2rv.propagate(t.year,t.month , t.day, t.hour, t.minute, t.second)

        trajectory = [(position1, velocity1)]

        for i in range(Npoints):
            t += TIME_PRECISION
            position1, velocity1 = self.twoline2rv.propagate(t.year,t.month , t.day, t.hour, t.minute, t.second)

            trajectory.append((position1, velocity1))

        return trajectory

    def dminWith(self, debris):
        Npoints = DURATION.seconds // TIME_PRECISION.seconds

        t= self.date

        position1, velocity1 = self.twoline2rv.propagate(t.year,t.month , t.day, t.hour, t.minute, t.second)
        position2, velocity2 = debris.twoline2rv.propagate(t.year,t.month , t.day, t.hour, t.minute, t.second)

        dmin = LA.norm(np.array(position2) - np.array(position1))
        for i in range(Npoints):
            t += TIME_PRECISION
            position1, velocity1 = self.twoline2rv.propagate(t.year,t.month , t.day, t.hour, t.minute, t.second)
            position2, velocity2 = debris.twoline2rv.propagate(t.year,t.month , t.day, t.hour, t.minute, t.second)

            d = LA.norm(np.array(position2) - np.array(position1))

            if d < dmin:
                dmin = d

        return dmin

class Coord:
    def __init__(self, position, velocity):
        self.position = position
        self.velocity = velocity

def fetchTLE():
    print('Beginning file download with wget module')

    uniqId = uuid.uuid4()

    httpHandler = urllib2.HTTPSHandler()
    httpHandler.set_http_debuglevel(1)
    opener = urllib2.build_opener(httpHandler)

    h = httplib.HTTPSConnection('www.space-track.org')

    headers = {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain"}
    data = urllib.urlencode({
            'query': 'https://www.space-track.org/basicspacedata/query/class/tle_latest/ORDINAL/1/EPOCH/%3Enow-30/MEAN_MOTION/%3E11.25/ECCENTRICITY/%3C0.25/OBJECT_TYPE/payload/orderby/NORAD_CAT_ID/format/tle',
            'identity': 'leonardocunha2107@gmail.com',
            'password': 'cestunputaindungroup'
            })
    h.request('POST', '/ajaxauth/login', data, headers)

    r = h.getresponse()

    with open('./tle_leo_'+str(uniqId), 'wb') as f:
        f.write(r.read())
    print('Downloaded !')

    return './tle_leo_'+str(uniqId)

def getDebris():
    tles = []
    lines = []
    with open('./tle_leo') as f:
        lines = f.readlines()

    newTLE = True
    for line in lines:
        if newTLE:
            tles.append([line])
            newTLE = False
        else:
            tles[-1].append(line)
            newTLE = True

    satellites = []
    for tle in tles:
        satellites.append(Debris(tle[0], tle[1]))

    return satellites

def getDminAmongDebris():

    debris = getDebris()

    dmin = debris[0].dminWith(debris[1])
    imin = 1

    for i in range(1, len(debris)):
        print(str(i) + ' : ' + str(dmin))

        d = debris[0].dminWith(debris[i])
        debris[i].dmin = d

        if d < dmin:
            dmin = d
            imin = i

    print(dmin)
    print(imin)
    print(debris[imin])


def getTrajectory(debrisId):
    debris = getDebris()
    trajectories = []
    
    print(len(debris))
    
    for i in debrisId:
        trajectories.append(debris[i].trajectory())
    
    with open('./trajectory_'+str(debrisId[-1]+1), 'wb') as f:
        f.write(json.dumps(trajectories))
    
    print('trajectory written !')