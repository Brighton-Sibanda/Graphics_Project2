// Last Edited by Brighton Sibanda 2025
// ACKNOWLEDGEMENTS::

// CS 351 Winter 2025 Lecture 12, Lecture 10, Lecture 11, and lecture 9 code - camera projections, lookat
// Slider event trigger functions from lecture, and terrain building functions
// Starter Code


import { VSHADER_SOURCE, FSHADER_SOURCE, buildColorAttributes, buildGridAttributes, initVBO, setupVec3, buildTerrainColors } from './utils.js';
import { g_cubeMesh, g_arm1Mesh, g_arm2Mesh } from './extras.js';

// Variables 
var g_canvas;
var gl;
var g_u_model_ref;
var g_u_world_ref;
var g_catMesh;
var g_dogMesh;
var g_ballMesh;
var g_world_matrix;
var g_projection_matrix;
var g_u_projection_ref;
var g_u_camera_ref;
const FLOAT_SIZE = 4;
let g_modelMatrices = [];
const GRID_Y_OFFSET = -0.5;
var start = false;
var dogOneUp = false;
var dogOneDown = false;
var dogOneUpProgress = 0.00;
var dogOneDownProgress = 0.00;
var ballUp = false;
var ballDown = false;
var ballUpProgress = 0.00;
var ballDownProgress = 0.00;
var catUp = false;
var catDown = false;
var catUpProgress = 0.00;
var catDownProgress = 0.00;
var catXCycle = 0;
var catXDirection = -0.02;
var g_cubeModelMatrix;
var g_arm1ModelMatrix;
var g_arm2ModelMatrix;
var g_lastFrameMS;
var roughness = 200;


// lookat information
var g_eye_x
var g_eye_y
var g_eye_z
var g_center_x
var g_center_y
var g_center_z
var g_cameraQuaternion = new Quaternion(0, 0.89, 0, -0.44);
var g_forwardVector = new Vector3([0, 0, -1]);  // Default forward

// initials for models
let dogMovingForward = true;
let dogMoveProgress = 0;
let dogRunning = false;

// Terrain Stuff
var terrainGenerator = new TerrainGenerator();
var seed = new Date().getMilliseconds();
var options = {
    width: 100,
    height: 1,
    depth: 100,
    seed: 10000000000000,
    noisefn: "wave", // Other options are "simplex" and "perlin"
    roughness: roughness
};
var terrain = terrainGenerator.generateTerrainMesh(options)
var g_terrainMesh = []
for (var i = 0; i < terrain.length; i++) {
    g_terrainMesh.push(...terrain[i])
}
var terrainColors = buildTerrainColors(terrain, options.height)

function main() {
    g_canvas = document.getElementById('canvas');
    gl = getWebGLContext(g_canvas, true);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    loadOBJFiles();
}

async function loadOBJFiles() {
    let catData = await fetch('./resources/cat.obj').then(response => response.text());
    let dogData = await fetch('./resources/dog.obj').then(response => response.text());
    let ballData = await fetch('./resources/ball.obj').then(response => response.text());

    g_dogMesh = [];
    g_ballMesh = [];
    g_catMesh = [];
    readObjFile(catData, g_catMesh);
    readObjFile(dogData, g_dogMesh);
    readObjFile(ballData, g_ballMesh);
    startRendering();
}

function startRendering() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }
    var catColors = buildColorAttributes(g_catMesh.length / 3, [1, 0, 0]);
    var ballColors = []
    var dogColors = buildColorAttributes(g_dogMesh.length / 3, [0, 1, 0]);
    var cubeColors = buildColorAttributes(g_cubeMesh.length / 3, [1, 1, 0]);
    var arm1Colors = buildColorAttributes(g_arm1Mesh.length / 3, [0, 1, 1]);
    var arm2Colors = buildColorAttributes(g_arm2Mesh.length / 3, [1, 0, 1]);
    for (let i = 0; i < g_ballMesh.length / 3; i++) {
        ballColors.push(Math.random(), Math.random(), Math.random()); // Random for the ball
    }

    // Add everything up to one VBO
    var data = g_catMesh.concat(g_dogMesh).concat(g_ballMesh).concat(g_cubeMesh).concat(g_arm1Mesh).concat(g_arm2Mesh).concat(g_terrainMesh)
        .concat(catColors).concat(dogColors).concat(ballColors).concat(cubeColors).concat(arm1Colors).concat(arm2Colors).concat(terrainColors);

    if (!initVBO(gl, new Float32Array(data))) return;

    if (!setupVec3(gl, 'a_Position', 0, 0)) return;
    if (!setupVec3(gl, 'a_Color', 0, (g_catMesh.length +
        g_dogMesh.length +
        g_ballMesh.length +
        g_cubeMesh.length +
        g_arm1Mesh.length +
        g_arm2Mesh.length +
        g_terrainMesh.length) * FLOAT_SIZE)) return;

    g_u_model_ref = gl.getUniformLocation(gl.program, 'u_Model');
    g_u_world_ref = gl.getUniformLocation(gl.program, 'u_World');
    g_u_projection_ref = gl.getUniformLocation(gl.program, 'u_Projection');
    g_u_camera_ref = gl.getUniformLocation(gl.program, 'u_Camera');
    g_world_matrix = new Matrix4();

    // default perspective matrix
    g_projection_matrix = new Matrix4().setPerspective(90, 1, .1, 100)
    // g_projection_matrix = new Matrix4().setPerspective(60, g_canvas.width / g_canvas.height, 0.1, 1000)
    // scaled cat, dog and ball
    g_modelMatrices = [
        new Matrix4().setScale(0.008, 0.008, 0.008),
        new Matrix4().setScale(0.01, 0.01, 0.01),
        new Matrix4().setScale(0.05, 0.05, 0.05)
    ];

    // gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    g_lastFrameMS = Date.now();

    // Initial fit for my view
    updateEyeX(-1)
    updateEyeY(0.14)
    updateEyeZ(-1.0)
    updateCenterX(0.0)
    updateCenterY(0.0)
    updateCenterZ(0.0)
    tick();
}

function draw() {
    // Set the lookat vector
    var lookatMatrix = setLookVector();
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Cat Mesh
    gl.uniformMatrix4fv(g_u_model_ref, false, g_modelMatrices[0].elements);
    gl.uniformMatrix4fv(g_u_world_ref, false, lookatMatrix.invert().elements); // adding for camera
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projection_matrix.elements); // adding for projection
    gl.drawArrays(gl.TRIANGLES, 0, g_catMesh.length / 3);

    // Dog Mesh
    gl.uniformMatrix4fv(g_u_model_ref, false, g_modelMatrices[1].elements);
    gl.uniformMatrix4fv(g_u_world_ref, false, lookatMatrix.invert().elements); // adding for camera
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projection_matrix.elements); // adding for projection
    gl.drawArrays(gl.TRIANGLES, g_catMesh.length / 3, g_dogMesh.length / 3);

    // Ball Mesh
    gl.uniformMatrix4fv(g_u_model_ref, false, g_modelMatrices[2].elements);
    gl.uniformMatrix4fv(g_u_world_ref, false, lookatMatrix.invert().elements); // adding for camera
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projection_matrix.elements); // adding for projection
    gl.drawArrays(gl.TRIANGLES, (g_catMesh.length + g_dogMesh.length) / 3, g_ballMesh.length / 3);

    // Cube
    gl.uniformMatrix4fv(g_u_model_ref, false, g_cubeModelMatrix.elements);
    gl.uniformMatrix4fv(g_u_world_ref, false, lookatMatrix.invert().elements); // adding for camera
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projection_matrix.elements); // adding for projection
    gl.drawArrays(gl.TRIANGLES, (g_catMesh.length + g_dogMesh.length + g_ballMesh.length) / 3, g_cubeMesh.length / 3);

    // first arm
    gl.uniformMatrix4fv(g_u_model_ref, false, g_arm1ModelMatrix.elements);
    gl.uniformMatrix4fv(g_u_world_ref, false, lookatMatrix.invert().elements); // adding for camera
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projection_matrix.elements); // adding for projection
    gl.drawArrays(gl.TRIANGLES, (g_catMesh.length + g_dogMesh.length + g_ballMesh.length + g_cubeMesh.length) / 3, g_arm1Mesh.length / 3);

    // second arm
    gl.uniformMatrix4fv(g_u_model_ref, false, g_arm2ModelMatrix.elements);
    gl.uniformMatrix4fv(g_u_world_ref, false, lookatMatrix.invert().elements); // adding for camera
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projection_matrix.elements); // adding for projection
    gl.drawArrays(gl.TRIANGLES, (g_catMesh.length + g_dogMesh.length + g_ballMesh.length + g_cubeMesh.length + g_arm1Mesh.length) / 3, g_arm2Mesh.length / 3);

    // grid
    // Terrain
    gl.uniformMatrix4fv(g_u_model_ref, false, new Matrix4().setTranslate(-10, 3 * GRID_Y_OFFSET, -10).elements)
    gl.uniformMatrix4fv(g_u_world_ref, false, lookatMatrix.invert().elements)
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projection_matrix.elements)
    gl.drawArrays(
        gl.TRIANGLES,
        (g_catMesh.length +
            g_dogMesh.length +
            g_ballMesh.length +
            g_cubeMesh.length +
            g_arm1Mesh.length +
            g_arm2Mesh.length) /
        3,
        g_terrainMesh.length / 3,
    )
}

function tick() {
    g_lastFrameMS = Date.now();

    // Initialize things that have not been
    if (start == false) {
        start = true;
        init();
    }

    if (dogOneDown || dogOneUp) {
        jumpDogOne();
    }

    bounceBall();
    if (catDown || catUp) {
        bounceCat();
    }

    moveCubes();

    draw();
    requestAnimationFrame(tick, g_canvas);
}

function moveCubes() {
    // 1Cube oscillation: Move back and forth
    let maxCubeMove = 0.3; // Maximum movement distance
    let moveSpeed = 1.5; // Speed of oscillation

    // Smooth Oscillation in the X direction - I'll make this sinusoidal for back and forth
    let cubeXPosition = maxCubeMove * Math.sin(Date.now() * 0.002 * moveSpeed);

    // Moving the Cube
    let cube_transform = new Matrix4();
    cube_transform.translate(cubeXPosition, 0, 0);
    g_cubeModelMatrix = cube_transform;

    // Arm wiggles between -20 and 20 degrees
    let maxRotationAngle = 20;
    let wiggleSpeed = 4.0;

    // Generate a smooth oscillation for wiggling effect
    let armRotationAngle = maxRotationAngle * Math.sin(Date.now() * 0.002 * wiggleSpeed);

    // Rotate Arm 1 (Left Arm) -  attached to cube
    let arm1_transform = new Matrix4();
    arm1_transform.set(g_cubeModelMatrix);
    arm1_transform.translate(-0.01, 0.0, 0.0);  // Move to the left side
    arm1_transform.rotate(armRotationAngle, 0, 1, 0); // rotate in y
    arm1_transform.translate(0.01, 0.0, 0.0);  // Move back
    g_arm1ModelMatrix = arm1_transform;

    // Rotate Arm 2 (Right Arm)
    let arm2_transform = new Matrix4();
    arm2_transform.set(g_cubeModelMatrix);
    arm2_transform.translate(0.1, 0.0, 0.0);
    arm2_transform.rotate(-armRotationAngle, 0, 1, 0);
    arm2_transform.translate(-0.1, 0.0, 0.0);
    g_arm2ModelMatrix = arm2_transform;
}

function init() {
    // rotate the cat and push the dog and wold away for visibility
    let cat_transform = new Matrix4();
    cat_transform.setRotate(240, 1, 1, 1);  // Rotate 240° around (1,1,1)
    cat_transform.translate(0.5, 0, -0.5);    // Then translate in Z direction
    g_modelMatrices[0] = cat_transform.multiply(g_modelMatrices[0]); // Apply to existing matrix

    // Init the dog
    let dog_transform = new Matrix4();
    dog_transform.setRotate(240, 1, 1, 1);
    dog_transform.translate(0, -0.5, -0.5);
    g_modelMatrices[1] = dog_transform.multiply(g_modelMatrices[1]);

    // Init the ball
    let ball_transform = new Matrix4();
    ball_transform.setRotate(240, 1, 1, 1);
    ball_transform.translate(0.3, -0.5, -0.3);
    g_modelMatrices[2] = ball_transform.multiply(g_modelMatrices[2]);

    // Initialize cube transformation
    let cube_transform = new Matrix4();
    cube_transform.setScale(2.05, 2.05, 2.05); // Scale up
    g_cubeModelMatrix = cube_transform;

    // Initialize arm
    let arm1_transform = new Matrix4();
    g_arm1ModelMatrix = arm1_transform;

    let arm2_transform = new Matrix4();
    g_arm2ModelMatrix = arm2_transform;
}

// Dog one jumping
function jumpDogOne() {

    // first up then down
    if (dogOneUp) {
        if (dogOneUpProgress < 30) {
            let dog_transform = new Matrix4();
            dog_transform.translate(0, 0.01, 0);
            g_modelMatrices[1] = dog_transform.multiply(g_modelMatrices[1]);
            dogOneUpProgress++;
        } else {
            dogOneUp = false;
            dogOneDown = true;
        }
    } else if (dogOneDown) {
        if (dogOneDownProgress < 30) {
            let dog_transform = new Matrix4();
            dog_transform.translate(0, -0.01, 0);
            g_modelMatrices[1] = dog_transform.multiply(g_modelMatrices[1]);
            dogOneDownProgress++;
        } else {
            dogOneDown = false;
            dogOneUpProgress = 0;
            dogOneDownProgress = 0;
        }
    }
    else {
        dogOneUp = true;
    }
}

function bounceBall() {

    // first up then down
    if (ballUp) {
        if (ballUpProgress < 30) {
            let ball_transform = new Matrix4();
            ball_transform.translate(0, 0.01, 0);
            g_modelMatrices[2] = ball_transform.multiply(g_modelMatrices[2]);
            ballUpProgress++;
        } else {
            ballUp = false;
            ballDown = true;
            catUp = true;
        }
    } else if (ballDown) {
        if (ballDownProgress < 30) {
            let ball_transform = new Matrix4();
            ball_transform.translate(0, -0.01, 0);
            g_modelMatrices[2] = ball_transform.multiply(g_modelMatrices[2]);
            ballDownProgress++;
        } else {
            ballDown = false;
            ballUpProgress = 0;
            ballDownProgress = 0;
        }
    }
    else {
        ballUp = true;
    }
    if (catXCycle >= 40) { // Switch X direction every 40 cycles
        catXDirection = -catXDirection;
        catXCycle = 0;
    }
}

function bounceCat() {
    // first up then down; but with x translation
    if (catUp) {
        if (catUpProgress < 20) {
            let cat_transform = new Matrix4();
            cat_transform.translate(catXDirection, 0.02, 0); // Moves upwards and slightly in the Z direction
            g_modelMatrices[0] = cat_transform.multiply(g_modelMatrices[0]);
            catUpProgress++;
            catXCycle++;
        } else {
            catUp = false;
            catDown = true;
        }
    } else if (catDown) {
        if (catDownProgress < 20) {
            let cat_transform = new Matrix4();
            cat_transform.translate(catXDirection, -0.02, 0); // Moves downwards and slightly back in x
            g_modelMatrices[0] = cat_transform.multiply(g_modelMatrices[0]);
            catDownProgress++;
            catXCycle++;
        } else {
            catDown = false;
            catUpProgress = 0;
            catDownProgress = 0;
        }
    }
    else {
        catUp = true;
    }
}

function moveDog() {
    if (!dogRunning) {
        return;
    }
    if (dogMoveProgress < 50) {
        let dog_transform = new Matrix4();
        dog_transform.translate(dogMovingForward ? 0.02 : -0.02, 0, 0);
        g_modelMatrices[1] = dog_transform.multiply(g_modelMatrices[1]);
        dogMoveProgress++;
    } else {
        dogMovingForward = !dogMovingForward;
        dogMoveProgress = 0;
    }
    requestAnimationFrame(moveDog);
}

function stopDog() {
    dogRunning = false;
}

function runDog() {
    dogRunning = true;
    moveDog();
}

// functions from lecture code
function updateEyeX(amount) {
    g_eye_x = Number(amount)
}

function updateEyeY(amount) {
    g_eye_y = Number(amount)
}

function updateEyeZ(amount) {
    g_eye_z = Number(amount)
}

function updateCenterX(amount) {
    g_center_x = Number(amount)
}

function updateCenterY(amount) {
    g_center_y = Number(amount)
}

function updateCenterZ(amount) {
    g_center_z = Number(amount)
}

// reset to defaults
function resetCam() {
    updateEyeX(-1)
    updateEyeY(0.14)
    updateEyeZ(-1.0)
    updateCenterX(0.0)
    updateCenterY(0.0)
    updateCenterZ(0.0)
    g_cameraQuaternion = new Quaternion(0, 0.89, 0, -0.44);
}

// Extras:::
function updateCameraRotation(deltaX, deltaY) {
    let rotX = new Quaternion();
    rotX.setFromAxisAngle(1, 0, 0, deltaY * 0.5); // X rotation
    let rotY = new Quaternion();
    rotY.setFromAxisAngle(0, 1, 0, deltaX * 0.5); // Y rotation

    // Combine rotations here
    g_cameraQuaternion.multiply(rotY, g_cameraQuaternion);
    g_cameraQuaternion.multiply(rotX, g_cameraQuaternion);

    // Convert quaternion to rotation matrix
    var rotationMatrix = new Matrix4().setFromQuat(
        g_cameraQuaternion.x, g_cameraQuaternion.y, g_cameraQuaternion.z, g_cameraQuaternion.w
    );

    // Calculate new forward and up vectors
    var forwardVector = rotationMatrix.multiplyVector3(new Vector3(0, 0, -1)); // Forward vector

    // Update the eye position based on the new lookat vector
    g_eye_x += forwardVector.elements[0];
    g_eye_y += forwardVector.elements[1];
    g_eye_z += forwardVector.elements[2];

}


document.addEventListener('keydown', function (event) {
    switch (event.key) {
        case 'ArrowDown':
            moveCamera(true);  // Move forward
            break;
        case 'ArrowUp':
            moveCamera(false);  // Move backward
            break;
        case 'w':
            updateCameraRotation(0, -5);  // Look up
            break;
        case 's':
            updateCameraRotation(0, 5);  // Look down
            break;
        case 'a':
            updateCameraRotation(-5, 0);  // Look left
            break;
        case 'd':
            updateCameraRotation(5, 0);  // Look right
            break;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    var slider = document.getElementById('roughness');
    var display = document.getElementById('roughValue');

    // Function to update the display when the slider value changes
    slider.oninput = function() {
        display.textContent = this.value;
        roughness = Number(this.value);
    }
});


function moveCamera(forward) {
    var speed = 0.1;  // Movement speed
    if (forward) {
        g_eye_x += g_forwardVector.elements[0] * speed;
        g_eye_y += g_forwardVector.elements[1] * speed;
        g_eye_z += g_forwardVector.elements[2] * speed;
    } else {
        g_eye_x -= g_forwardVector.elements[0] * speed;
        g_eye_y -= g_forwardVector.elements[1] * speed;
        g_eye_z -= g_forwardVector.elements[2] * speed;
    }
}


function setLookVector() {
    var rotationMatrix = new Matrix4().setFromQuat(g_cameraQuaternion.x, g_cameraQuaternion.y, g_cameraQuaternion.z, g_cameraQuaternion.w);
    var lookDirection = rotationMatrix.multiplyVector3(new Vector3([0, 0, -1])); // Forward vector
    var upDirection = rotationMatrix.multiplyVector3(new Vector3([0, 1, 0]));    // Up vector

    return new Matrix4().setLookAt(
        g_eye_x, g_eye_y, g_eye_z,
        g_eye_x + lookDirection.elements[0], g_eye_y + lookDirection.elements[1], g_eye_z + lookDirection.elements[2],
        upDirection.elements[0], upDirection.elements[1], upDirection.elements[2]
    );
}

function regen() {
    // change g_terrain mesh
    // apply buffer subData
    // Terrain Stuff
    // TODO: Edit roughness from slider
    options = {
        width: 100,
        height: 1,
        depth: 100,
        seed: 10000000000000,
        noisefn: "wave", // Other options are "simplex" and "perlin"
        roughness: roughness
    };
    terrain = terrainGenerator.generateTerrainMesh(options);
    g_terrainMesh = [];
    for (var i = 0; i < terrain.length; i++) {
        g_terrainMesh.push(...terrain[i]);
    }
    terrainColors = buildTerrainColors(terrain, options.height);

    let offset = FLOAT_SIZE * (g_catMesh.length + g_dogMesh.length + g_ballMesh.length + g_cubeMesh.length + g_arm1Mesh.length + g_arm2Mesh.length);
    gl.bufferSubData(gl.ARRAY_BUFFER, offset, new Float32Array(g_terrainMesh));
    let offset2 = offset + (FLOAT_SIZE * (g_terrainMesh.length + catColors.length + dogColors.length + ballColors.length + cubeColors.length + arm1Colors.length + arm2Colors.length));
    gl.bufferSubData(gl.ARRAY_BUFFER, offset2, new Float32Array(terrainColors));
}

// export to html
window.main = main;
window.jumpDogOne = jumpDogOne;
window.runDog = runDog;
window.stopDog = stopDog;
window.resetCam = resetCam;
window.regen = regen;