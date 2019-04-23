var timeDelta=5; //timeDelta in minutes
var Tfinal=300; // duration until end in minutes also
var earthSphereRadius = 200;
var earthRealRadius = 6371;
var rrs = earthSphereRadius / earthRealRadius;

function our_satellite(tle1,tle2){
    this.sat=satellite.twoline2satrec(tle1,tle2);
    this.traj=[];
    for(var j=0;j<Tfinal;j+=timeDelta){
        var aux = satellite.sgp4(sat,j);
        aux.position.x=rrs*aux.position.x;
        aux.position.y=rrs*aux.position.y;
        aux.position.z=rrs*aux.position.z;
        aux.velocity.x=rrs*aux.velocity.x;
        aux.velocity.y=rrs*aux.velocity.y;
        aux.velocity.z=rrs*aux.velocity.z;
        traj.push(aux);
    }
}

var our_sat; // = TODO

function debris(tle1,tle2){
    this.sat=satellite.twoline2satrec(tle1,tle2);
    this.traj=[];
    for(var j=0;j<Tfinal;j+=timeDelta){
       var aux = satellite.sgp4(sat,j);
        aux.position.x=rrs*aux.position.x;
        aux.position.y=rrs*aux.position.y;
        aux.position.z=rrs*aux.position.z;
        aux.velocity.x=rrs*aux.velocity.x;
        aux.velocity.y=rrs*aux.velocity.y;
        aux.velocity.z=rrs*aux.velocity.z;
        traj.push(aux);
    ]
    this.risk=risk(our_sat,this);
}

function dist(a,b){
    return ((a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2)**0.5
}
function risk(our_sat,debris){
    
    var dmin=dist(our_sat.traj[0],debris.traj[0]);
    danger=-1;
    var jcol=0;
    for(int j=1;j<debris.traj.length;j++)
        if(dist(our_sat.traj[j].position,debris.traj[j].position)<dmin){
            dmin=dist(our_sat.traj[j],debris.traj[j]);
            jcol=j;
        }
    var vcol=dist(debris.traj[jcol].velocity,our_sat.traj[jcol].velocity);
    var tcol=jcol*timeDelta; //in minutes
    return dmin/(vcol**0.2)*(tcol**0.3);
}
function traceDebris(){
    var tles; // = TODO
    
    var moons=[];
    var Nsat=lines.length/2;
    for(var i=0;i<Nsats;i+=2){
        var sat=new debris(lines[i],lines[i+1]);
        sats.push(sat);
    }
    moons.sort(function(a,b){return a.risk-b.risk});
    return moons;
}
