var trajectory;

var container, stats;
var camera, scene, renderer;
var group;
var mouseX = 0, mouseY = 0;
var moon;
var canvas;
var controls;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;


var earthSphereRadius = 200;
var earthRealRadius = 6371;
var ratioRealToSphere = earthSphereRadius / earthRealRadius;

var timeDelta=1; //timeDelta in minutes
var tFinal=3000; // duration until end in minutes also

var movingDebris = true;
var cameraOnOurSat = 0;

var partNumber = 1;

init();

function init() {
  scene = new THREE.Scene();

  group = new THREE.Group();
  scene.add( group );

  // earth

  var loader = new THREE.TextureLoader();
  loader.load( 'three.js/examples/textures/land_ocean_ice_cloud_2048.jpg', function ( texture ) {
    var geometry = new THREE.SphereBufferGeometry( earthSphereRadius, 64, 64 );

    var material = new THREE.MeshBasicMaterial( {
      map: texture
    } );
    var mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

  } );

  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.z = 1000;

  controls = new THREE.OrbitControls( camera );

  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  window.addEventListener( 'resize', onWindowResize, false );
}

function initRender() {
  container = document.getElementById("container");
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );

  container.appendChild( renderer.domElement );

  stats = new Stats();
  container.appendChild( stats.dom );
  animate();
  moveDebris();
}

function onWindowResize() {

  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

  mouseX = ( event.clientX - windowHalfX );
  mouseY = ( event.clientY - windowHalfY );

}

//

function animate() {

  requestAnimationFrame( animate );

  render();
  stats.update();

}


var positionIndex = 0;

function toggleMovingDebris() {
  if (movingDebris) {
    movingDebris = false;
  } else {
    movingDebris = true;
  }
}
document.getElementById('buttonMovingDebris').addEventListener('click', toggleMovingDebris);

function toggleCamera() {
  if (cameraOnOurSat == 2) {
    cameraOnOurSat = 0;
  } else {
    cameraOnOurSat++;
  }
}
document.getElementById('buttonCameraOnOurSat').addEventListener('click', toggleCamera);

function togglePartNumber() {
  // resetAnimation();
  if (partNumber == 3) {
    partNumber = 1;
  } else {
    partNumber++;
  }
}
document.getElementById('buttonPart').addEventListener('click', togglePartNumber);

function resetAnimation() {
  positionIndex = 0;
  refreshTimeDisplay();
}
document.getElementById('buttonReset').addEventListener('click', resetAnimation);

function buttonSlower() {
  refreshingRate *= 2;
}
function buttonFaster() {
  refreshingRate /= 2;
}
document.getElementById('buttonSlower').addEventListener('click', buttonSlower);
document.getElementById('buttonFaster').addEventListener('click', buttonFaster);


function moveDebris() {
  setTimeout(moveDebris, refreshingRate*1000);
  if(movingDebris) {
    if (typeof positionIndex !== 'undefined' &&typeof moon !== 'undefined') {
      if (positionIndex == timeOfCollision) {
        toggleMovingDebris();
      }

      for (var i = 0; i < numOfDebris; i++) {
        if (i != ourSatId && typeof debris[i] !== 'undefined' && typeof moons[i] !== 'undefined') {
          moons[i].position.x = trajectories[i][positionIndex].position.x;
          moons[i].position.y = trajectories[i][positionIndex].position.y;
          moons[i].position.z = trajectories[i][positionIndex].position.z;
        }
      }
      ourMoon.position.x = ourTrajectory[positionIndex].position.x;
      ourMoon.position.y = ourTrajectory[positionIndex].position.y;
      ourMoon.position.z = ourTrajectory[positionIndex].position.z;


      dealWithParts();


      refreshTimeDisplay();

      if (positionIndex < tFinal/timeDelta - 2) {
        positionIndex += 1;
      } else {
        positionIndex = 0;
      }
    }
  }

}

function dealWithParts() {
  if (partNumber == 2) {
    ourRadar.position.x = ourTrajectory[positionIndex].position.x;
    ourRadar.position.y = ourTrajectory[positionIndex].position.y;
    ourRadar.position.z = ourTrajectory[positionIndex].position.z;


    radarCone.position.x = 0;
    radarCone.position.y = 0;
    radarCone.position.z = 0;

    return;
  }
  if (partNumber == 3) {

    ourRadar.position.x = 0;
    ourRadar.position.y = 0;
    ourRadar.position.z = 0;
    var directionToLookAt = new THREE.Vector3();

    radarCone.position.x = ourTrajectory[positionIndex].position.x;
    radarCone.position.y = ourTrajectory[positionIndex].position.y;
    radarCone.position.z = ourTrajectory[positionIndex].position.z;
    directionToLookAt.subVectors( moons[mostDangerousDebId].position, radarCone.position ).normalize();

    radarCone.lookAt(moons[mostDangerousDebId].position);
    radarCone.translateOnAxis(radarCone.worldToLocal(moons[mostDangerousDebId].position).normalize(),360*ratioRealToSphere/2);
    return;
  }
  ourRadar.position.x = 0;
  ourRadar.position.y = 0;
  ourRadar.position.z = 0;
  radarCone.position.x = 0;
  radarCone.position.y = 0;
  radarCone.position.z = 0;
}

function refreshTimeDisplay() {
  document.getElementById("timeSpan").textContent = positionIndex;
}

function render() {

  group.rotation.y -= 0.005;
  dealWithCam();

  renderer.render( scene, camera );

}

function dealWithCam() {
  if (cameraOnOurSat == 0) {
    const ourPos = ourTrajectory[positionIndex].position;
    const ourVel = ourTrajectory[positionIndex].velocity;
    camera.position.x = ourPos.x*1.1 - ourVel.x*200;
    camera.position.y = ourPos.y*1.1 - ourVel.y*200;
    camera.position.z = ourPos.z*1.1 - ourVel.z*200;
    camera.lookAt( new THREE.Vector3(
      ourPos.x,
      ourPos.y,
      ourPos.z
    ) );
  } else if(cameraOnOurSat == 1) {
    const ourPos = ourTrajectory[positionIndex].position;
    const ourVel = ourTrajectory[positionIndex].velocity;
    camera.position.x = ourPos.x*1.5;
    camera.position.y = ourPos.y*1.5;
    camera.position.z = ourPos.z*1.5;
    camera.lookAt( new THREE.Vector3(
      ourPos.x,
      ourPos.y,
      ourPos.z
    ) );
  } else {
    controls.update();

    camera.lookAt( scene.position );
  }
}

function getTrajectory() {

}

function drawOurLine() {
  var i = 0;
  while(dist(ourTrajectory[0].position, ourTrajectory[i].position) < 5) {
    i++;
  }
  while(dist(ourTrajectory[0].position, ourTrajectory[i].position) > 1) {

    i++;
  }
  const numberOfSegments = 250;
  const numberForOneTurn = i + numberOfSegments + 1;
  const step = Math.floor(numberForOneTurn / numberOfSegments);
  var material = new THREE.LineBasicMaterial( {
    color: 0xffffff
  } );
  var geometry = new THREE.Geometry();
  for (var i = 0; i < numberOfSegments; i++) {
    geometry.vertices.push(new THREE.Vector3(
      ourTrajectory[i * step].position.x,
      ourTrajectory[i * step].position.y,
      ourTrajectory[i * step].position.z
    ) );
  }
  var line = new THREE.Line( geometry, material );
  scene.add(line);
  console.log(line);
}

// obj - your object (THREE.Object3D or derived)
// point - the point of rotation (THREE.Vector3)
// axis - the axis of rotation (normalized THREE.Vector3)
// theta - radian value of rotation
// pointIsWorld - boolean indicating the point is in world coordinates (default = false)
function rotateAboutPoint(obj, point, axis, theta, pointIsWorld){
	pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;

	if(pointIsWorld){
		obj.parent.localToWorld(obj.position); // compensate for world coordinate
	}

	obj.position.sub(point); // remove the offset
	obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
	obj.position.add(point); // re-add the offset

	if(pointIsWorld){
		obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
	}

	obj.rotateOnAxis(axis, theta); // rotate the OBJECT
}
