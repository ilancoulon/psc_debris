var trajectory;
var trajectories;

var container, stats;
var camera, scene, renderer;
var group;
var mouseX = 0, mouseY = 0;
var moon;
var moons;
var canvas;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;


var earthSphereRadius = 200;
var earthRealRadius = 6371;
var ratioRealToSphere = earthSphereRadius / earthRealRadius;

var movingDebris = true;

init();
animate();
moveDebris();
var debs = traceDebris();
function handleFileSelect(evt) {
  var file = evt.target.files[0]; // FileList object

  // files is a FileList of File objects. List some properties.
  var output = [];


  // Closure to capture the file information.

  for (var i = 0; i < debs.length;i++) {
    var texture = new THREE.CanvasTexture( canvas );
    var geometry = new THREE.SphereBufferGeometry( 100*ratioRealToSphere, 8, 8 );
    var material = new THREE.MeshLambertMaterial( { map: texture } );
    material.color = new Three.Color(100/debs[i].risk,0,0);
    moon = new THREE.Mesh( geometry, material );
    scene.add( moon );
    moons.push(moon);
  }
 
}
document.getElementById('tleFile').addEventListener('change', handleFileSelect, false);

var event = new MouseEvent('change', {
  view: window,
  bubbles: true,
  cancelable: true
});
var cancelled = !document.getElementById('tleFile').dispatchEvent(event);





function init() {

  container = document.getElementById( 'container' );

  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.z = 500;

  scene = new THREE.Scene();

  group = new THREE.Group();
  scene.add( group );

  // earth

  var loader = new THREE.TextureLoader();
  loader.load( 'three.js/examples/textures/land_ocean_ice_cloud_2048.jpg', function ( texture ) {

    var geometry = new THREE.SphereBufferGeometry( earthSphereRadius, 20, 20 );

    var material = new THREE.MeshLambertMaterial( { map: texture } );
    var mesh = new THREE.Mesh( geometry, material );
    group.add( mesh );

  } );

  // shadow

  canvas = document.createElement( 'canvas' );
  canvas.width = 30;
  canvas.height = 30;

  var context = canvas.getContext( '2d' );
  var gradient = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2
  );
  gradient.addColorStop( 0.1, 'rgba(255,100,100,1)' );
  gradient.addColorStop( 1, 'rgba(255,0,0,1)' );

  context.fillStyle = gradient;
  context.fillRect( 0, 0, canvas.width, canvas.height );

  var texture = new THREE.CanvasTexture( canvas );

  var geometry = new THREE.PlaneBufferGeometry( 300, 300, 3, 3 );
  var material = new THREE.MeshBasicMaterial( { map: texture } );


  // Plan
  var mesh = new THREE.Mesh( geometry, material );
  mesh.position.y = - 250;
  mesh.rotation.x = - Math.PI / 2;
  //group.add( mesh );


  // Moon
  // var geometry = new THREE.SphereBufferGeometry( 5, 20, 20 );
  //
  // var material = new THREE.MeshLambertMaterial( { map: texture } );
  // moon = new THREE.Mesh( geometry, material );
  // moon.position.x = 250;
  // scene.add( moon );




  renderer = new THREE.SoftwareRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );

  container.appendChild( renderer.domElement );

  stats = new Stats();
  container.appendChild( stats.dom );

  document.addEventListener( 'mousemove', onDocumentMouseMove, false );

  //

  window.addEventListener( 'resize', onWindowResize, false );

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

function moveDebris() {
  setTimeout(moveDebris, 20);
  if(movingDebris) {

    if (typeof positionIndex !== 'undefined' &&typeof moon !== 'undefined' && typeof trajectories !== 'undefined') {
      for (var i = 0; i < debs.length; i++) {
        moons[i].position.x = (debs[i].traj)[positionIndex].x;
        moons[i].position.y = (debs[i].traj)[positionIndex].y;
        moons[i].position.z = (debs[i].traj)[positionIndex].z;
      }




      if (positionIndex < trajectories[0].length - 2) {
        positionIndex += 1;
      } else {
        positionIndex = 0;
      }
    }
  }

}

function render() {

  group.rotation.y -= 0.005;
  camera.position.x += ( mouseX - camera.position.x ) * 0.5;
  camera.position.y += ( - mouseY - camera.position.y ) * 0.5;
  camera.lookAt( scene.position );

  renderer.render( scene, camera );

}

function getTrajectory() {

}
