// Last edited by Dietrich Geisler 2025

const VSHADER_SOURCE = `
    attribute vec3 a_Position;
    uniform mat4 u_Model;
    uniform mat4 u_World;
    uniform mat4 u_Camera;
    uniform mat4 u_Projection;
    attribute vec3 a_Color;
    varying vec3 v_Color;
    void main() {
        gl_Position = u_Projection * u_Camera * u_World * u_Model * vec4(a_Position, 1.0);
        v_Color = a_Color;
    }
`

const FSHADER_SOURCE = `
    varying mediump vec3 v_Color;
    void main() {
        gl_FragColor = vec4(v_Color, 1.0);
    }
`

// references to general information
var g_canvas
var gl
var g_lastFrameMS

// GLSL uniform references
var g_u_model_ref
var g_u_world_ref
var g_u_camera_ref
var g_u_projection_ref

// model/world/camera/projection
var g_modelMatrix
var g_worldMatrix
var g_cameraMatrix
var g_projectionMatrix

// rotation globals
var g_roll
var g_pitch
var g_yaw

// Mesh definition
var g_planeMesh

// The size in bytes of a floating point
const FLOAT_SIZE = 4

function main() {
    // Slider setup
    slider_input = document.getElementById('sliderRoll')
    slider_input.addEventListener('input', (event) => {
        updateRoll(event.target.value)
    })

    slider_input = document.getElementById('sliderPitch')
    slider_input.addEventListener('input', (event) => {
        updatePitch(event.target.value)
    })

    slider_input = document.getElementById('sliderYaw')
    slider_input.addEventListener('input', (event) => {
        updateYaw(event.target.value)
    })

    g_canvas = document.getElementById('canvas')

    // Get the rendering context for WebGL
    gl = getWebGLContext(g_canvas, true)
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL')
        return
    }

    // We will call this at the end of most main functions from now on
    loadOBJFiles()
}

/*
 * Helper function to load OBJ files in sequence
 * For much larger files, you may are welcome to make this more parallel
 * I made everything sequential for this class to make the logic easier to follow
 */
async function loadOBJFiles() {
    // open our OBJ file(s)
    data = await fetch('/resources/plane.obj').then(response => response.text()).then((x) => x)
    g_planeMesh = []
    readObjFile(data, g_planeMesh)

    // Wait to load our models before starting to render
    startRendering()
}

function startRendering() {
    // Initialize GPU's vertex and fragment shaders programs
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.')
        return
    }

    // initialize the VBO
    var colors = buildColorAttributes(g_planeMesh.length / 3)
    var data = g_planeMesh.concat(colors)
    if (!initVBO(new Float32Array(data))) {
        return
    }

    // Send our vertex data to the GPU
    if (!setupVec3('a_Position', 0, 0)) {
        return
    }
    if (!setupVec3('a_Color', 0, g_planeMesh.length * FLOAT_SIZE)) {
        return
    }

    // Get references to GLSL uniforms
    g_u_model_ref = gl.getUniformLocation(gl.program, 'u_Model')
    g_u_world_ref = gl.getUniformLocation(gl.program, 'u_World')
    g_u_camera_ref = gl.getUniformLocation(gl.program, 'u_Camera')
    g_u_projection_ref = gl.getUniformLocation(gl.program, 'u_Projection')

    gl_modelMatrix = new Matrix4()

    // Reposition our mesh to fit in the projection
    g_worldMatrix = new Matrix4().translate(0, 0, -2)

    // Initially set our camera to be in a default position
    g_cameraMatrix = new Matrix4()

    // Setup a reasonabl "basic" perspective projection
    g_projectionMatrix = new Matrix4().setPerspective(20, 1, 1, 10)

    // Enable culling and depth
    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)

    // Setup for ticks
    g_lastFrameMS = Date.now()

    // setup the starting position
    updateRoll(0)
    updatePitch(0)
    updateYaw(0)
    updateRotation()

    tick()
}

// function to apply all the logic for a single frame tick
function tick() {
    // time since the last frame
    var deltaTime

    // calculate deltaTime
    var current_time = Date.now()
    deltaTime = current_time - g_lastFrameMS
    g_lastFrameMS = current_time

    draw()

    requestAnimationFrame(tick, g_canvas)
}

// draw to the screen on the next frame
function draw() {
    // Clear the canvas with a black background
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // Update with our global transformation matrices
    gl.uniformMatrix4fv(g_u_model_ref, false, g_modelMatrix.elements)
    gl.uniformMatrix4fv(g_u_world_ref, false, g_worldMatrix.elements)
    gl.uniformMatrix4fv(g_u_camera_ref, false, g_cameraMatrix.elements)
    gl.uniformMatrix4fv(g_u_projection_ref, false, g_projectionMatrix.elements)

    gl.drawArrays(gl.TRIANGLES, 0, g_planeMesh.length / 3)
}

// Helper to construct colors
// makes every triangle a slightly different shade of blue
function buildColorAttributes(vertex_count) {
    var colors = []
    for (var i = 0; i < vertex_count / 3; i++) {
        // three vertices per triangle
        for (var vert = 0; vert < 3; vert++) {
            var shade = (i * 3) / vertex_count
            colors.push(shade, shade, 1.0)
        }
    }

    return colors
}

function updateRoll(amount) {
    label = document.getElementById('roll')
    label.textContent = `Roll: ${Number(amount).toFixed(2)}`
    g_roll = Number(amount)
    updateRotation()
}

function updatePitch(amount) {
    label = document.getElementById('pitch')
    label.textContent = `Pitch: ${Number(amount).toFixed(2)}`
    g_pitch = Number(amount)
    updateRotation()
}

function updateYaw(amount) {
    label = document.getElementById('yaw')
    label.textContent = `Yaw: ${Number(amount).toFixed(2)}`
    g_yaw = Number(amount)
    updateRotation()
}

// helper function, called whenever we update pitch, roll, or yaw
function updateRotation() {
    rotationMatrix = new Matrix4()
    // apply the yaw-pitch-roll
    // negate each of these angles to apply the rotation to the plane
    // keep pitch positive so we can look "down" at the plane
    rotationMatrix.rotate(-g_roll, 1, 0, 0)
    rotationMatrix.rotate(g_pitch, 0, 1, 0)
    rotationMatrix.rotate(-g_yaw, 0, 0, 1)

    // reset to facing to the right such that the plane's Z is pointed toward the camera
    // in other words, we start by looking from above the plane
    g_modelMatrix = new Matrix4().rotate(90, 1, 0, 0).scale(.01, .01, .01)
    g_modelMatrix = rotationMatrix.multiply(g_modelMatrix)
}

/*
 * Initialize the VBO with the provided data
 * Assumes we are going to have "static" (unchanging) data
 */
function initVBO(data) {
    // get the VBO handle
    var VBOloc = gl.createBuffer()
    if (!VBOloc) {
        console.log('Failed to create the vertex buffer object')
        return false
    }

    // Bind the VBO to the GPU array and copy `data` into that VBO
    gl.bindBuffer(gl.ARRAY_BUFFER, VBOloc)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

    return true
}

/*
 * Helper function to load the given vec3 data chunk onto the VBO
 * Requires that the VBO already be setup and assigned to the GPU
 */
function setupVec3(name, stride, offset) {
    // Get the attribute by name
    var attributeID = gl.getAttribLocation(gl.program, `${name}`)
    if (attributeID < 0) {
        console.log(`Failed to get the storage location of ${name}`)
        return false
    }

    // Set how the GPU fills the a_Position variable with data from the GPU 
    gl.vertexAttribPointer(attributeID, 3, gl.FLOAT, false, stride, offset)
    gl.enableVertexAttribArray(attributeID)

    return true
}