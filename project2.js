// Last Edited by Brighton Sibanda 2025
// ACKNOWLEDGEMENTS::
// CS 351 Winter 2025 Lecture 12, Lecture 10, Lecture 11, and lecture 9 code - camera projections, lookat
// Slider event trigger functions from lecture, and terrain building functions
// TODO: Cite the baycentric algorithm
// TODO: Outsource code that shouldnt be here necessarily
// TODO:

import {
    VSHADER_SOURCE,
    FSHADER_SOURCE,
    initVBO,
    setupVec3,
    buildTerrainColors,
    buildPerVertex,
    buildColorAttributes
} from "./utils.js"
import {
    g_cubeMesh,
    g_arm1Mesh,
    g_arm2Mesh,
    cubeColorGrid,
    armVertexColors,
} from "./extras.js"

// Variables
var g_canvas
var gl
var g_u_model_ref
var g_u_world_ref
var g_world_matrix
var g_projection_matrix
var g_u_projection_ref
var g_u_camera_ref
const FLOAT_SIZE = 4
const g_modelMatrices = []
const GRID_Y_OFFSET = -0.5
var start = false
var g_cubeModelMatrix
var g_arm1ModelMatrix
var g_arm2ModelMatrix
var g_sphereModelMatrix
var g_lastFrameMS
var roughness = 200
var height = 5
var cubeOffset = 1
var g_sphereMesh

// User-controlled sphere position
var g_sphereX = 0
var g_sphereZ = 0
var g_sphereSpeed = 0.05

// lookat information
var g_eye_x
var g_eye_y
var g_eye_z
var g_center_x
var g_center_y
var g_center_z
var g_cameraQuaternion = new Quaternion(0, 0.9248405874600257, 0, -0.35912887836026175)
var g_forwardVector = new Vector3([0, 0, -1]) // Default forward

// Terrain Stuff
var width = 100
var depth = 100
var terrainGenerator = new TerrainGenerator()
var options = {
    width: width,
    height: height,
    depth: depth,
    seed: 10000000000000,
    noisefn: "wave", // Other options are "simplex" and "perlin"
    roughness: roughness,
}
var terrain = terrainGenerator.generateTerrainMesh(options)
for (let i = 0; i < terrain.length; i++) {
    terrain[i] = terrain[i].map((component) => component * 0.2)
}
var g_terrainMesh = []
for (var i = 0; i < terrain.length; i++) {
    g_terrainMesh.push(...terrain[i])
}
var terrainColors = buildTerrainColors(terrain, options.height)

function main() {
    g_canvas = document.getElementById("canvas")
    gl = getWebGLContext(g_canvas, true) // Assuming getWebGLContext is imported from a library
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL")
        return
    }
    loadOBJFiles();
}

var cubeColors
var arm1Colors
var arm2Colors
var sphereColors

async function loadOBJFiles() {
    let ballData = await fetch('./resources/ball.obj').then(response => response.text());

    g_sphereMesh = []
    readObjFile(ballData, g_sphereMesh);
    startRendering();
}


function startRendering() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        // Assuming initShaders is imported from a library
        console.log("Failed to initialize shaders.")
        return
    }


    cubeColors = buildPerVertex(cubeColorGrid)
    arm1Colors = buildPerVertex(armVertexColors)
    arm2Colors = buildPerVertex(armVertexColors)
    sphereColors = buildColorAttributes(g_sphereMesh.length / 3, [1, 0, 0])

    // Add everything up to one VBO
    var data = g_cubeMesh
        .concat(g_arm1Mesh)
        .concat(g_arm2Mesh)
        .concat(g_sphereMesh)
        .concat(g_terrainMesh)
        .concat(cubeColors)
        .concat(arm1Colors)
        .concat(arm2Colors)
        .concat(sphereColors)
        .concat(terrainColors)

    if (!initVBO(gl, new Float32Array(data))) return

    if (!setupVec3(gl, "a_Position", 0, 0)) return
    if (
        !setupVec3(
            gl,
            "a_Color",
            0,
            (g_cubeMesh.length + g_arm1Mesh.length + g_arm2Mesh.length + g_sphereMesh.length + g_terrainMesh.length) *
            FLOAT_SIZE,
        )
    )
        return

    g_u_model_ref = gl.getUniformLocation(gl.program, "u_Model")
    g_u_world_ref = gl.getUniformLocation(gl.program, "u_World")
    g_u_projection_ref = gl.getUniformLocation(gl.program, "u_Projection")
    g_u_camera_ref = gl.getUniformLocation(gl.program, "u_Camera")
    g_world_matrix = new Matrix4()

    // default perspective matrix
    g_projection_matrix = new Matrix4().setPerspective(90, 1, 0.1, 100)

    gl.enable(gl.DEPTH_TEST)

    g_lastFrameMS = Date.now()

    // Initial fit for my view
    updateEyeX(-1)
    updateEyeY(0.14)
    updateEyeZ(-4.6)
    updateCenterX(0.0)
    updateCenterY(0.0)
    updateCenterZ(0.0)
    tick()
}

function draw() {
    // Set the lookat vector
    var lookatMatrix = setLookVector()
    gl.clearColor(0.2, 0.0, 0.2, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Cube
    gl.uniformMatrix4fv(g_u_model_ref, false, g_cubeModelMatrix.elements)
    gl.uniformMatrix4fv(g_u_world_ref, false, lookatMatrix.invert().elements) // adding for camera
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projection_matrix.elements) // adding for projection
    gl.drawArrays(gl.TRIANGLES, 0, g_cubeMesh.length / 3)

    // first arm
    gl.uniformMatrix4fv(g_u_model_ref, false, g_arm1ModelMatrix.elements)
    gl.uniformMatrix4fv(g_u_world_ref, false, lookatMatrix.invert().elements) // adding for camera
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projection_matrix.elements) // adding for projection
    gl.drawArrays(gl.TRIANGLES, g_cubeMesh.length / 3, g_arm1Mesh.length / 3)

    // second arm
    gl.uniformMatrix4fv(g_u_model_ref, false, g_arm2ModelMatrix.elements)
    gl.uniformMatrix4fv(g_u_world_ref, false, lookatMatrix.invert().elements) // adding for camera
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projection_matrix.elements) // adding for projection
    gl.drawArrays(gl.TRIANGLES, (g_cubeMesh.length + g_arm1Mesh.length) / 3, g_arm2Mesh.length / 3)

    // User-controlled sphere
    gl.uniformMatrix4fv(g_u_model_ref, false, g_sphereModelMatrix.elements)
    gl.uniformMatrix4fv(g_u_world_ref, false, lookatMatrix.invert().elements)
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projection_matrix.elements)
    gl.drawArrays(gl.TRIANGLES, (g_cubeMesh.length + g_arm1Mesh.length + g_arm2Mesh.length) / 3, g_sphereMesh.length / 3)

    // Terrain
    gl.uniformMatrix4fv(g_u_model_ref, false, new Matrix4().setTranslate(-10, 3 * GRID_Y_OFFSET, -10).elements)
    gl.uniformMatrix4fv(g_u_world_ref, false, lookatMatrix.invert().elements)
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projection_matrix.elements)
    gl.drawArrays(
        gl.TRIANGLES,
        (g_cubeMesh.length + g_arm1Mesh.length + g_arm2Mesh.length + g_sphereMesh.length) / 3,
        g_terrainMesh.length / 3,
    )
}

function tick() {
    const currentTime = Date.now()
    const deltaTime = (currentTime - g_lastFrameMS) / 1000 // Convert to seconds
    g_lastFrameMS = currentTime

    // Initialize things that have not been
    if (start == false) {
        start = true
        init()
    }

    // terrain code
    moveCubes(deltaTime)
    handleCubeTerrain()
    handleArm1Terrain()
    handleArm2Terrain()
    handleSphereTerrain()

    draw()
    requestAnimationFrame(tick, g_canvas)
}

function moveCubes(deltaTime) {
    // Cube oscillation: Move back and forth
    const maxCubeMove = 1.5 // Reduced maximum movement distance
    const moveSpeed = 0.3 // Reduced speed of oscillation for smoother movement

    // Smooth Oscillation in the X direction - I'll make this sinusoidal for back and forth
    const cubeXPosition = maxCubeMove * Math.sin(Date.now() * 0.002 * moveSpeed)

    // Moving the Cube
    const cube_transform = new Matrix4()
    cube_transform.translate(cubeXPosition, 0, 0)
    g_cubeModelMatrix = cube_transform

    // Arm wiggles between -20 and 20 degrees
    const maxRotationAngle = 20
    const wiggleSpeed = 4.0

    // Generate a smooth oscillation for wiggling effect
    const armRotationAngle = maxRotationAngle * Math.sin(Date.now() * 0.002 * wiggleSpeed)

    // Rotate Arm 1 (Left Arm) -  attached to cube
    const arm1_transform = new Matrix4()
    arm1_transform.set(g_cubeModelMatrix)
    arm1_transform.translate(-0.01, 0.0, 0.0) // Move to the left side
    arm1_transform.rotate(armRotationAngle, 0, 1, 0) // rotate in y
    arm1_transform.translate(0.01, 0.0, 0.0) // Move back
    g_arm1ModelMatrix = arm1_transform

    // Rotate Arm 2 (Right Arm)
    const arm2_transform = new Matrix4()
    arm2_transform.set(g_cubeModelMatrix)
    arm2_transform.translate(0.1, 0.0, 0.0)
    arm2_transform.rotate(-armRotationAngle, 0, 1, 0)
    arm2_transform.translate(-0.1, 0.0, 0.0)
    g_arm2ModelMatrix = arm2_transform

    // Update user-controlled sphere position
    const sphere_transform = new Matrix4()
    sphere_transform.translate(g_sphereX, 0, g_sphereZ)
    g_sphereModelMatrix = sphere_transform.multiply(g_sphereModelMatrix)
    g_sphereX = 0
    g_sphereZ = 0
}

function init() {
    // Initialize cube transformation
    const cube_transform = new Matrix4()
    cube_transform.setScale(1, 1, 1)
    g_cubeModelMatrix = cube_transform

    // Initialize arms
    const arm1_transform = new Matrix4()
    g_arm1ModelMatrix = arm1_transform

    const arm2_transform = new Matrix4()
    g_arm2ModelMatrix = arm2_transform

    // Initialize user-controlled sphere
    const sphere_transform = new Matrix4()
    sphere_transform.translate(0, 0.1, 0).setScale(0.15, 0.15, 0.15) // Make the sphere a bit smaller
    g_sphereModelMatrix = sphere_transform
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
    updateEyeZ(-4.6)
    updateCenterX(0.0)
    updateCenterY(0.0)
    updateCenterZ(0.0)
    g_cameraQuaternion = new Quaternion(0, 0.9248405874600257, 0, -0.35912887836026175)
}

// Camera rotation
function updateCameraRotation(deltaX, deltaY) {
    const rotX = new Quaternion()
    rotX.setFromAxisAngle(1, 0, 0, deltaY * 0.5) // X rotation
    const rotY = new Quaternion()
    rotY.setFromAxisAngle(0, 1, 0, deltaX * 0.5) // Y rotation

    // Combine rotations here
    g_cameraQuaternion.multiply(rotY, g_cameraQuaternion)
    g_cameraQuaternion.multiply(rotX, g_cameraQuaternion)

    // Convert quaternion to rotation matrix
    var rotationMatrix = new Matrix4().setFromQuat(
        g_cameraQuaternion.x,
        g_cameraQuaternion.y,
        g_cameraQuaternion.z,
        g_cameraQuaternion.w,
    )

    // Calculate new forward vector
    var forwardVector = rotationMatrix.multiplyVector3(new Vector3(0, 0, -1))

    // Update the eye position based on the new lookat vector
    g_eye_x += forwardVector.elements[0]
    g_eye_y += forwardVector.elements[1]
    g_eye_z += forwardVector.elements[2]
}

// Event listeners
document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowDown":
            moveCamera(true) // Move forward
            break
        case "ArrowUp":
            moveCamera(false) // Move backward
            break
        case "w":
            updateCameraRotation(0, -5) // Look up
            break
        case "s":
            updateCameraRotation(0, 5) // Look down
            break
        case "a":
            updateCameraRotation(-5, 0) // Look left
            break
        case "d":
            updateCameraRotation(5, 0) // Look right
            break
        // User-controlled sphere movement
        case "i":
            g_sphereZ -= g_sphereSpeed // Move sphere forward
            break
        case "k":
            g_sphereZ += g_sphereSpeed // Move sphere backward
            break
        case "j":
            g_sphereX -= g_sphereSpeed // Move sphere left
            break
        case "l":
            g_sphereX += g_sphereSpeed // Move sphere right
            break
    }
})

document.addEventListener("DOMContentLoaded", () => {
    var slider = document.getElementById("roughness")
    var display = document.getElementById("roughValue")

    // Function to update the display when the slider value changes
    slider.oninput = function () {
        display.textContent = this.value
        roughness = Number(this.value)
    }
})

function moveCamera(forward) {
    var speed = 0.1 // Movement speed
    if (forward) {
        g_eye_x += g_forwardVector.elements[0] * speed
        g_eye_y += g_forwardVector.elements[1] * speed
        g_eye_z += g_forwardVector.elements[2] * speed
    } else {
        g_eye_x -= g_forwardVector.elements[0] * speed
        g_eye_y -= g_forwardVector.elements[1] * speed
        g_eye_z -= g_forwardVector.elements[2] * speed
    }
}

function setLookVector() {
    var rotationMatrix = new Matrix4().setFromQuat(
        g_cameraQuaternion.x,
        g_cameraQuaternion.y,
        g_cameraQuaternion.z,
        g_cameraQuaternion.w,
    )
    var lookDirection = rotationMatrix.multiplyVector3(new Vector3([0, 0, -1])) // Forward vector
    var upDirection = rotationMatrix.multiplyVector3(new Vector3([0, 1, 0])) // Up vector
    // Update the global forward vector
   
    return new Matrix4().setLookAt(
        g_eye_x,
        g_eye_y,
        g_eye_z,
        g_eye_x + lookDirection.elements[0],
        g_eye_y + lookDirection.elements[1],
        g_eye_z + lookDirection.elements[2],
        upDirection.elements[0],
        upDirection.elements[1],
        upDirection.elements[2],
    )
}

// Terrain functions
function regen() {
    options = {
        width: 100,
        height: height,
        depth: 100,
        seed: 10000000000000,
        noisefn: "wave",
        roughness: roughness,
    }
    terrain = terrainGenerator.generateTerrainMesh(options)
    for (let i = 0; i < terrain.length; i++) {
        terrain[i] = terrain[i].map((component) => component * 0.2)
    }

    const epsilon = 0.1
    filteredTerrain = terrain.filter((point) => Math.abs(point[2] - 10) <= epsilon)

    g_terrainMesh = []
    for (var i = 0; i < terrain.length; i++) {
        g_terrainMesh.push(...terrain[i])
    }
    terrainColors = buildTerrainColors(terrain, options.height)

    const offset = FLOAT_SIZE * (g_cubeMesh.length + g_arm1Mesh.length + g_arm2Mesh.length + g_sphereMesh.length)
    gl.bufferSubData(gl.ARRAY_BUFFER, offset, new Float32Array(g_terrainMesh))
    const offset2 =
        offset +
        FLOAT_SIZE *
        (g_terrainMesh.length + cubeColors.length + arm1Colors.length + arm2Colors.length + sphereColors.length)
    gl.bufferSubData(gl.ARRAY_BUFFER, offset2, new Float32Array(terrainColors))
}

function getTerrainHeight(x, terrain) {
    let closestPoint = null
    let minDistance = Number.POSITIVE_INFINITY

    for (const point of terrain) {
        const distance = Math.abs(point[0] - x) // Only compare the x distances
        if (distance < minDistance) {
            minDistance = distance
            closestPoint = point
        }
    }

    // Return the height of the closest point
    return closestPoint ? closestPoint[1] : null
}

const epsilon = 0.1 // Adjust epsilon as needed to define "very close"
let filteredTerrain = terrain.filter((point) => Math.abs(point[2] - 10) <= epsilon)

function handleCubeTerrain() {
    const modelX = g_cubeModelMatrix.elements[12] + 10 // Cube X position
    const modelZ = g_cubeModelMatrix.elements[14] + 10 // Cube Z position
    const modelY = g_cubeModelMatrix.elements[13]

    const height = getTerrainHeight(modelX, filteredTerrain)
    if (height !== null) {
        // Add smoothing interpolation for height changes
        window.lastCubeTerrainHeight = window.lastCubeTerrainHeight !== undefined ? window.lastCubeTerrainHeight : height

        // Interpolate between the last height and the current height for smoother transitions
        const smoothedHeight = window.lastCubeTerrainHeight + (height - window.lastCubeTerrainHeight) * 0.1
        window.lastCubeTerrainHeight = smoothedHeight

        const need = smoothedHeight
        const temp_transform = new Matrix4().translate(0, need - modelY - cubeOffset, 0)
        g_cubeModelMatrix = temp_transform.multiply(g_cubeModelMatrix)
    }
}

function handleArm1Terrain() {
    const modelX = g_arm1ModelMatrix.elements[12] + 10 // Arm1 X position
    const modelZ = g_arm1ModelMatrix.elements[14] + 10 // Arm1 Z position
    const modelY = g_arm1ModelMatrix.elements[13]

    const height = getTerrainHeight(modelX, filteredTerrain)
    if (height !== null) {
        window.lastArm1TerrainHeight = window.lastArm1TerrainHeight !== undefined ? window.lastArm1TerrainHeight : height

        const smoothedHeight = window.lastArm1TerrainHeight + (height - window.lastArm1TerrainHeight) * 0.15 // Slightly faster response
        window.lastArm1TerrainHeight = smoothedHeight

        const need = smoothedHeight
        const temp_transform = new Matrix4().translate(0, need - modelY - cubeOffset, 0)
        g_arm1ModelMatrix = temp_transform.multiply(g_arm1ModelMatrix)
    }
}

function handleArm2Terrain() {
    const modelX = g_arm2ModelMatrix.elements[12] + 10 // Arm2 X position
    const modelZ = g_arm2ModelMatrix.elements[14] + 10 // Arm2 Z position
    const modelY = g_arm2ModelMatrix.elements[13]

    const height = getTerrainHeight(modelX, filteredTerrain)
    if (height !== null) {
        window.lastArm2TerrainHeight = window.lastArm2TerrainHeight !== undefined ? window.lastArm2TerrainHeight : height

        const smoothedHeight = window.lastArm2TerrainHeight + (height - window.lastArm2TerrainHeight) * 0.12 // Different smoothing factor
        window.lastArm2TerrainHeight = smoothedHeight

        const need = smoothedHeight
        const temp_transform = new Matrix4().translate(0, need - modelY - cubeOffset, 0)
        g_arm2ModelMatrix = temp_transform.multiply(g_arm2ModelMatrix)
    }
}

function handleSphereTerrain() {
    const modelX = g_sphereModelMatrix.elements[12] + 10 // Sphere X position
    const modelZ = g_sphereModelMatrix.elements[14] + 10 // Sphere Z position
    const modelY = g_sphereModelMatrix.elements[13]

    const height = getTerrainHeight(modelX, filteredTerrain)
    if (height !== null) {
        window.lastSphereTerrainHeight =
            window.lastSphereTerrainHeight !== undefined ? window.lastSphereTerrainHeight : height

        const smoothedHeight = window.lastSphereTerrainHeight + (height - window.lastSphereTerrainHeight) * 0.1
        window.lastSphereTerrainHeight = smoothedHeight

        const need = smoothedHeight
        const temp_transform = new Matrix4().translate(0, need - modelY - cubeOffset, 0)
        g_sphereModelMatrix = temp_transform.multiply(g_sphereModelMatrix)
    }
}

// Export to HTML
window.main = main
window.resetCam = resetCam
window.regen = regen

