var debris;
var ourSat;
var moons;
var ourMoon;
var ourRadar;
var radarCone;
var trajectories;
var ourTrajectory;
var risks;

var ourSatGroup;

var numOfDebris = 1600;

const ourSatId = 2681;
const mostDangerousDebId = 2858;
var timeOfCollision;

const sizeOfDebris = 30;

var speedRatio = 50;
var refreshingRate = 0.05;//s

function drawMoons() {
  calcTraj();
  calculateRisks();
  drawOurLine();
  var detail = detailRisk(mostDangerousDebId);
  timeOfCollision = detail.tcol - 2;
  moons = [];

  ourSatGroup = new THREE.Group();
  scene.add(ourSatGroup);


  var geometry2 = new THREE.SphereBufferGeometry( (sizeOfDebris)*ratioRealToSphere, 16, 16 );
  var material2 = new THREE.MeshBasicMaterial();
  ourMoon = new THREE.Mesh( geometry2, material2 );
  ourSatGroup.add( ourMoon );

  var geometry2 = new THREE.SphereBufferGeometry( (49)*ratioRealToSphere, 16, 16 );
  var material2 = new THREE.MeshBasicMaterial();
  material2.color = new THREE.Color(0,0,1);
  material2.transparent = true;
  material2.opacity = 0.5;
  ourRadar = new THREE.Mesh( geometry2, material2 );
  ourSatGroup.add( ourRadar );


  var geometry2 = new THREE.ConeGeometry( 10*ratioRealToSphere, 360*ratioRealToSphere, 32 );
  geometry2.applyMatrix(new THREE.Matrix4().makeRotationX(- Math.PI / 2));
  var material2 = new THREE.MeshBasicMaterial();
  material2.color = new THREE.Color(1,0,0);
  material2.transparent = true;
  material2.opacity = 0.5;
  radarCone = new THREE.Mesh( geometry2, material2 );
  ourSatGroup.add( radarCone );

  for (var i = 0; i < numOfDebris-1; i++) {
    var geometry = new THREE.SphereBufferGeometry( sizeOfDebris*ratioRealToSphere, 16, 16 );
    var material = new THREE.MeshBasicMaterial();
    if (i == mostDangerousDebId) {
      material.color = new THREE.Color(0,0,1);
    } else {
      material.color = new THREE.Color(risks[i],1-risks[i],0);
    }
    moon = new THREE.Mesh( geometry, material );
    scene.add( moon );
    moons.push(moon);

  }

  initRender();
}

function calcTraj() {
  trajectories = [];

  var nowDate = moment("2019-04-23 12:30").toDate();
  var nowJ = jday(nowDate.getUTCFullYear(),
               nowDate.getUTCMonth() + 1,
               nowDate.getUTCDate(),
               nowDate.getUTCHours(),
               nowDate.getUTCMinutes(),
               nowDate.getUTCSeconds());
  nowJ += nowDate.getUTCMilliseconds() * 1.15741e-8; //days per millisecond

  console.groupCollapsed("Calculating trajectories...");

  for (var i = 0; i < debris.length; i++) {
    console.log(i+"/"+debris.length);
    trajectories[i] = [];
    var now = (nowJ - debris[i].jdsatepoch) * 1440.0; //in minutes
    for(var t=0; t < tFinal; t += timeDelta){
      var aux = satellite.sgp4(debris[i], now + (t/60 * refreshingRate * speedRatio));

      if (!aux.position || !aux.velocity) {
        aux = {
          position: {
            x: 0,
            y: 0,
            z: 0
          },
          velocity: {
            x: 0,
            y: 0,
            z: 0
          }
        }
      }

      trajectories[i].push({
        position: {
          x: ratioRealToSphere * aux.position.x,
          y: ratioRealToSphere * aux.position.y,
          z: ratioRealToSphere * aux.position.z
        },
        velocity: {
          x: ratioRealToSphere * aux.velocity.x,
          y: ratioRealToSphere * aux.velocity.y,
          z: ratioRealToSphere * aux.velocity.z
        }
      });
    }
  }
  console.groupEnd();
  var now = (nowJ - ourSat.jdsatepoch) * 1440.0; //in minutes

  ourTrajectory = [];
  for(var t=0; t < tFinal; t += timeDelta){
    var aux = satellite.sgp4(ourSat,now + t/60 * refreshingRate * speedRatio);
    ourTrajectory.push({
      position: {
        x: ratioRealToSphere * aux.position.x,
        y: ratioRealToSphere * aux.position.y,
        z: ratioRealToSphere * aux.position.z
      },
      velocity: {
        x: ratioRealToSphere * aux.velocity.x,
        y: ratioRealToSphere * aux.velocity.y,
        z: ratioRealToSphere * aux.velocity.z
      }
    });
  }
}

function calculateRisks() {
  risks = [];
  var maxRisk = 0;
  var maxRiskId = 0;
  for (var i = 0; i < trajectories.length; i++) {
    risks.push(calculateRisk(i));
    if (calculateRisk(i) > maxRisk) {
      maxRisk = calculateRisk(i);
      maxRiskId = i;
    }
  }
}

function dist(a,b){
    return ((a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2)**0.5
}

function calculateRisk(i) {
  var dmin=dist(ourTrajectory[0].position,trajectories[i][0].position);
  var jcol=0;
  for(var j=1;j<trajectories[i].length;j++) {
    var distancej = dist(ourTrajectory[j].position, trajectories[i][j].position);
    if(distancej < dmin){
      dmin  =distancej;
      jcol = j;
    }
  }
  var vcol=dist(ourTrajectory[jcol].velocity, trajectories[i][jcol].velocity);
  var tcol=jcol*timeDelta+1; //in minutes
  return 100  * vcol**0.3 / (dmin**2 * (tcol**0.2));
}
function detailRisk(i) {
  var dmin=dist(ourTrajectory[0].position,trajectories[i][0].position);
  var jcol=0;
  for(var j=1;j<trajectories[i].length;j++) {
    var distancej = dist(ourTrajectory[j].position, trajectories[i][j].position);
    if(distancej < dmin){
      dmin  =distancej;
      jcol = j;
    }
  }
  var vcol=dist(ourTrajectory[jcol].velocity, trajectories[i][jcol].velocity);
  var tcol=jcol*timeDelta+1; //in minutes
  return {
    risk: 100 / (dmin/(vcol**0.2)*(tcol**0.3)),
    dmin: dmin,
    vcol: vcol,
    jcol: jcol,
    tcol: tcol
  };
}
function findClosest() {
  var maxRisk = 0;
  var curRisk = 0;
  var maxSat = 0;
  var maxDeb = 0;
  for (var i = 0; i < trajectories.length; i++) {
    console.log("Oursat : "+i);
    ourTrajectory = trajectories[i];
    for (var j = i+1; j < trajectories.length; j++) {
      curRisk = calculateRisk(j);
      if(curRisk > maxRisk) {
        maxRisk = curRisk;
        maxSat = i;
        maxDeb = j;
      }
    }
  }
  return {
    maxRisk: maxRisk,
    maxSat: maxSat,
    maxDeb: maxDeb
  }
}

function fetchTLE() {
  console.log("Fetching TLE from spacetrack...");
  const query = 'https://www.space-track.org/basicspacedata/query/class/tle_latest/ORDINAL/1/EPOCH/%3Enow-30/MEAN_MOTION/%3E11.25/ECCENTRICITY/%3C0.25/OBJECT_TYPE/payload/orderby/NORAD_CAT_ID/format/tle';
  var url = new URL("https://ilancoulon.github.io/psc_debris/tle.txt");
  fetch(url, {
    method: 'GET'
  })
  .then(res => res.text())
  .then(
    (result) => {
      console.log("TLEs fetched !");
      const tles = result.split('\n');
      numOfDebris = tles.length/2 - 1;
      ourSat = satellite.twoline2satrec(tles[0], tles[1]);
      debris = [];
      for (var i = 2; i < numOfDebris*2; i+=2) {
        const satrec = satellite.twoline2satrec(tles[i], tles[i+1]);
        debris.push(satrec);
      }
      ourSat = debris[ourSatId];
      drawMoons();
    },
    (error) => {
      console.log(error);
    }
  );

}

fetchTLE();

function jday(year, mon, day, hr, minute, sec){ //from satellite.js
  'use strict';
  return (367.0 * year -
        Math.floor((7 * (year + Math.floor((mon + 9) / 12.0))) * 0.25) +
        Math.floor( 275 * mon / 9.0 ) +
        day + 1721013.5 +
        ((sec / 60.0 + minute) / 60.0 + hr) / 24.0  //  ut in days
        //#  - 0.5*sgn(100.0*year + mon - 190002.5) + 0.5;
        );
}
