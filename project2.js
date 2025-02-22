// Last Edited by Brighton Sibanda 2025
// ACKNOWLEDGEMENTS::

// CS 351 Winter 2025 Lecture 10, Lecture 11, and lecture 9 code - camera projections, lookat
// Slider event trigger functions from lecture
// Starter Code


import { VSHADER_SOURCE, FSHADER_SOURCE, buildColorAttributes, buildGridAttributes, initVBO, setupVec3 } from './utils.js';
import { g_cubeMesh, g_arm1Mesh, g_arm2Mesh } from './extras.js';

// Variables 
var g_canvas;
var gl;
var g_u_model_ref;
var g_u_world_ref;
var g_catMesh;
var g_dogMesh;
var g_ballMesh;
var g_gridMesh;
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


// lookat information
var g_eye_x
var g_eye_y
var g_eye_z
var g_center_x
var g_center_y
var g_center_z
var slider_input
var label


function main() {

    // Setup our camera movement sliders
    slider_input = document.getElementById('sliderEyeZ')
    slider_input.addEventListener('input', (event) => {
        updateEyeZ(event.target.value)
    })
    slider_input = document.getElementById('sliderCenterZ')
    slider_input.addEventListener('input', (event) => {
        updateCenterZ(event.target.value)
    })
    slider_input = document.getElementById('sliderEyeY')
    slider_input.addEventListener('input', (event) => {
        updateEyeY(event.target.value)
    })
    slider_input = document.getElementById('sliderCenterY')
    slider_input.addEventListener('input', (event) => {
        updateCenterY(event.target.value)
    })
    slider_input = document.getElementById('sliderEyeX')
    slider_input.addEventListener('input', (event) => {
        updateEyeX(event.target.value)
    })
    slider_input = document.getElementById('sliderCenterX')
    slider_input.addEventListener('input', (event) => {
        updateCenterX(event.target.value)
    })

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

    var gridInfo = buildGridAttributes(1, 1, [0.0, 1.0, 0.0]);
    g_gridMesh = gridInfo[0];
    var catColors = buildColorAttributes(g_catMesh.length / 3, [1, 0, 0]);
    var ballColors = []
    var dogColors = buildColorAttributes(g_dogMesh.length / 3, [0, 1, 0]);
    var cubeColors = buildColorAttributes(g_cubeMesh.length / 3, [0, 1, 0]);
    var arm1Colors = buildColorAttributes(g_arm1Mesh.length / 3, [0, 1, 0]);
    var arm2Colors = buildColorAttributes(g_arm2Mesh.length / 3, [1, 1, 0]);
    for (let i = 0; i < g_ballMesh.length / 3; i++) {
        ballColors.push(Math.random(), Math.random(), Math.random()); // Random for the ball
    }

    // Add everything up to one VBO
    var data = g_catMesh.concat(g_dogMesh).concat(g_ballMesh).concat(g_cubeMesh).concat(g_arm1Mesh).concat(g_arm2Mesh).concat(gridInfo[0])
        .concat(catColors).concat(dogColors).concat(ballColors).concat(cubeColors).concat(arm1Colors).concat(arm2Colors).concat(gridInfo[1]);

    if (!initVBO(gl, new Float32Array(data))) return;

    if (!setupVec3(gl, 'a_Position', 0, 0)) return;
    if (!setupVec3(gl, 'a_Color', 0, (g_catMesh.length + g_dogMesh.length + g_ballMesh.length + gridInfo[0].length) * FLOAT_SIZE)) return;

    g_u_model_ref = gl.getUniformLocation(gl.program, 'u_Model');
    g_u_world_ref = gl.getUniformLocation(gl.program, 'u_World');
    g_u_projection_ref = gl.getUniformLocation(gl.program, 'u_Projection');
    g_u_camera_ref = gl.getUniformLocation(gl.program, 'u_Camera');
    g_world_matrix = new Matrix4();

    // default perspective matrix
    g_projection_matrix = new Matrix4().setPerspective(90, 1, .1, 100)
    // scaled cat, dog and ball
    g_modelMatrices = [
        new Matrix4().setScale(0.008, 0.008, 0.008),
        new Matrix4().setScale(0.01, 0.01, 0.01),
        new Matrix4().setScale(0.05, 0.05, 0.05)
    ];

    // gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    g_lastFrameMS = Date.now();

    // Initial fit for my view for my view
    updateEyeX(-1)
    updateEyeY(0.14)
    updateEyeZ(-1.0)
    updateCenterX(1.0)
    updateCenterY(0.0)
    updateCenterZ(-1.0)
    tick();
}

function draw() {
    // directly set our world matrix to be the lookat matrix we want
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
    gl.uniformMatrix4fv(g_u_model_ref, false, new Matrix4().elements);
    gl.uniformMatrix4fv(g_u_world_ref, false, lookatMatrix.invert().translate(0, GRID_Y_OFFSET, 0).elements); // maybe change this
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projection_matrix.elements); // adding for projection
    gl.drawArrays(gl.LINES, (g_catMesh.length + g_dogMesh.length + g_ballMesh.length + g_cubeMesh.length + g_arm1Mesh.length + g_arm2Mesh.length) / 3, g_gridMesh.length / 3);
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

    draw();
    requestAnimationFrame(tick, g_canvas);
}

/* My additional functions start here */

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

let dogMovingForward = true;
let dogMoveProgress = 0;
let dogRunning = false;

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
    label = document.getElementById('eyeX')
    label.textContent = `Eye X: ${Number(amount).toFixed(2)}`
    g_eye_x = Number(amount)
}

function updateEyeY(amount) {
    label = document.getElementById('eyeY')
    label.textContent = `Eye Y: ${Number(amount).toFixed(2)}`
    g_eye_y = Number(amount)
}

function updateEyeZ(amount) {
    label = document.getElementById('eyeZ')
    label.textContent = `Eye Z: ${Number(amount).toFixed(2)}`
    g_eye_z = Number(amount)
}

function updateCenterX(amount) {
    label = document.getElementById('eyeX')
    label.textContent = `Eye X: ${Number(amount).toFixed(2)}`
    g_center_x = Number(amount)
}

function updateCenterY(amount) {
    label = document.getElementById('eyeY')
    label.textContent = `Eye Y: ${Number(amount).toFixed(2)}`
    g_center_y = Number(amount)
}

function updateCenterZ(amount) {
    label = document.getElementById('centerZ')
    label.textContent = `Center Z: ${Number(amount).toFixed(2)}`
    g_center_z = Number(amount)
}

function resetCam(){
    updateEyeX(-1)
    updateEyeY(0.14)
    updateEyeZ(-1.0)
    updateCenterX(1.0)
    updateCenterY(0.0)
    updateCenterZ(-1.0)
}

function setLookVector(){
    return new Matrix4().setLookAt(
        g_eye_x, g_eye_y, g_eye_z,
        // negate Z for right-handed coordinates here
        g_center_x, g_center_y, -g_center_z,
        0, 1, 0
    );
}

// New Code
// quarternions
let cameraQuaternion = new Quaternion();

function updateCameraRotation(input) {
    let yaw = Quaternion.fromAxisAngle([0, 1, 0], degreesToRadians(input.yaw));
    let pitch = Quaternion.fromAxisAngle([1, 0, 0], degreesToRadians(input.pitch));
    cameraQuaternion = yaw.multiply(cameraQuaternion).multiply(pitch);
}

function updateCameraPosition(input) {
    let rotMatrix = cameraQuaternion.toMatrix4();
    let forward = rotMatrix.multiplyVec3([0, 0, -1]);
    let right = rotMatrix.multiplyVec3([1, 0, 0]);

    if (input.forward) cameraPosition = cameraPosition.add(forward.scale(input.moveSpeed));
    if (input.backward) cameraPosition = cameraPosition.subtract(forward.scale(input.moveSpeed));
    if (input.strafeRight) cameraPosition = cameraPosition.add(right.scale(input.moveSpeed));
    if (input.strafeLeft) cameraPosition = cameraPosition.subtract(right.scale(input.moveSpeed));
}



// export to html
window.main = main;
window.jumpDogOne = jumpDogOne;
window.runDog = runDog;
window.stopDog = stopDog;
window.resetCam = resetCam;