var debris;
var ourSat;
var moons;
var ourMoon;
var trajectories;
var ourTrajectory;
var risks;

var numOfDebris = 200;

const ourSatId = 38;
const mostDangerousDebId = 40;
var timeOfCollision;

function drawMoons() {
  calcTraj();
  calculateRisks();
  drawOurLine();
  var detail = detailRisk(mostDangerousDebId);
  timeOfCollision = detail.tcol;
  moons = [];

  var geometry = new THREE.SphereBufferGeometry( 100*ratioRealToSphere, 4, 4 );
  var material = new THREE.MeshLambertMaterial();
  material.color = new THREE.Color(1,1,1);
  ourMoon = new THREE.Mesh( geometry, material );
  scene.add( ourMoon );

  for (var i = 0; i < numOfDebris; i++) {
    var geometry = new THREE.SphereBufferGeometry( 100*ratioRealToSphere, 4, 4 );
    var material = new THREE.MeshLambertMaterial();
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

  for (var i = 0; i < debris.length; i++) {
    trajectories[i] = [];
    for(var t=0; t < tFinal; t += timeDelta){
      var aux = satellite.sgp4(debris[i],t);

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
  ourTrajectory = [];
  for(var t=0; t < tFinal; t += timeDelta){
    var aux = satellite.sgp4(ourSat,t);
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
  return 100 / (dmin/(vcol**0.2)*(tcol**0.3));
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
  var url = new URL("http://psc3d/homemade/api.txt");
  fetch(url, {
    method: 'POST'
  })
  .then(res => res.text())
  .then(
    (result) => {
      console.log("TLEs fetched !");
      const tles = result.split('\n');
      ourSat = satellite.twoline2satrec(tles[0], tles[1]);
      debris = [];
      for (var i = 2; i < numOfDebris; i+=2) {
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
