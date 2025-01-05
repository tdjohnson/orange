import * as THREE from 'three';
import {meshloader} from './objects.mjs';
import {collisionDetection} from './collision.mjs'


const BulletArray = [];
var currentPositon;
var buletLifetime = 10;
var collidableMeshList = [];

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

export function updateCollidableMeshList(newMeshList) {
    collidableMeshList = newMeshList;
}


export function addBullet(renderer) {
    var newBullet = new Bullet(renderer);
    var initialBulletPositionVector = currentPositon.position
    //console.log(currentPositon);
    const raycasterFront = new THREE.Raycaster(initialBulletPositionVector , new THREE.Vector3( 1, 0, 0 ), 0, 20 );

    const bulletDirection = currentPositon.getWorldDirection(raycasterFront.ray.direction);
    const lookAtPoint = new THREE.Vector3().addVectors(bulletDirection, initialBulletPositionVector);
    newBullet.position.set(initialBulletPositionVector.x, initialBulletPositionVector.y, initialBulletPositionVector.z);
    newBullet.lookAt(lookAtPoint);
    BulletArray.push(newBullet);

    var intersectArray = raycasterFront.intersectObjects(collidableMeshList);
    //console.log(intersectArray);
    //console.log(raycasterFront);

    //intersectArray[0] contains the first object that is intersected when a bullet is shot.
    //If this is a jailBotBody, you shot a player
    if(intersectArray.length > 0) {
        console.log(intersectArray[0].object.name);
        if(intersectArray[0].object.name == "Body") {
            var playerIDshot = intersectArray[0].object.parent.parent.playerid;
            console.log(playerIDshot);
        }
    }

}

export function getBulletArray() {
    return BulletArray;
}

export function setPositionReference(camera) {
    currentPositon = camera;
}