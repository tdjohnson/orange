var scene;
var camera;
var renderer;
var loader = new THREE.ColladaLoader();

function render()
{
requestAnimationFrame(render);
renderer.render(scene, camera);
}
function resize()
{
camera.aspect = window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth , window.innerHeight);
}
function createMeshes()
{
try
{

var orange = new THREE.LineBasicMaterial({color: 0xcc6633});

g = new THREE.Geometry();
g.vertices.push(new THREE.Vector3(0,0,0));
g.vertices.push(new THREE.Vector3(1, 0,0));
g.vertices.push(new THREE.Vector3(1, 1,0));
g.vertices.push(new THREE.Vector3(0, 1,0));
g.vertices.push(new THREE.Vector3(0,0,0));
var quadrat = new THREE.Line(g, orange, THREE.LineStrip);


var m = new THREE.Matrix4();

var m1 = new THREE.Matrix4();
var m2 = new THREE.Matrix4();
var m3 = new THREE.Matrix4();

var alpha = 0;
var beta = Math.PI;
var gamma = Math.PI/2;

m1.makeRotationX( alpha );
m2.makeRotationY( beta );
m3.makeRotationZ( gamma );

m.multiplyMatrices( m1, m2 );
m.multiply( m3 );


scene.add(quadrat);

}
catch(e)
{
// Im Fehlerfall wird ein Fehler im Browserfenster ausgegeben
alert(e);
}
}
function update()
{
requestAnimationFrame(update);
var time = Date.now() * 0.0001;
var camera_distance = 5;
camera.position.x = Math.cos(time) * camera_distance;
camera.position.z = Math.sin(time) * camera_distance;
camera.lookAt(new THREE.Vector3(0,0,0));
render();
}


function createMesh(path)
{
loader = new THREE.ColladaLoader();
loader.options.convertUpAxis = true;
loader.load(path, function (collada)
{
var model = collada.scene.children[0];
model.scale.x = model.scale.y = model.scale.z = 3;
scene.add(model);
});
}

function init(){
var w = window.innerWidth;
var h = window.innerHeight;
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(100,w /h, 0.1, 1000);
renderer = new THREE.WebGLRenderer();


var dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(100, 100, 50);
scene.add(dirLight);
var light = new THREE.PointLight(0xffffff);
light.position.y = 0;
light.position.z = 0;
//createMeshes();
createMesh('../../Resources/Models/lego.dae');
camera.position.z = 1;
scene.add(light);
renderer.setSize(window.innerWidth , window.innerHeight);
document.body.appendChild(renderer.domElement);
update();
}