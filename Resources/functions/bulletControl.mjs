import * as THREE from 'three';
import {meshloader} from './objects.mjs';


const BulletArray = [];
var currentPositon;
var buuletLifetime = 10;

export class Bullet extends THREE.Mesh {
    constructor(renderer) {
        super();
		this.name = 'Bullet_' + this.id;
        var scope = this;
        this.birthday = Date.now();

        meshloader('./Prototypes/Bullet/Bullet.glb',function(model) {
			scope.add(model);
		}, renderer);
    }

    getName() {
        return this.name;
    }

}


export function addBullet(renderer) {
    var newBullet = new Bullet(renderer);
    var initialBulletPositionVector = currentPositon.position
    //console.log(currentPositon);
    const raycasterFront = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 1, 0, 0 ), 0, 1 );

    const bulletDirection = currentPositon.getWorldDirection(raycasterFront.ray.direction);
    const lookAtPoint = new THREE.Vector3().addVectors(bulletDirection, initialBulletPositionVector);
    newBullet.position.set(initialBulletPositionVector.x, initialBulletPositionVector.y, initialBulletPositionVector.z);
    newBullet.lookAt(lookAtPoint);
    BulletArray.push(newBullet);
}

export function getBulletArray() {
    return BulletArray;
}

export function setPositionReference(camera) {
    currentPositon = camera;
}