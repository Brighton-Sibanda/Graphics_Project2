
// some custom meshes here

export const g_cubeMesh = [
    // Front face
    -0.1, -0.1, 0.1, 0.1, -0.1, 0.1, 0.1, 0.1, 0.1,
    -0.1, -0.1, 0.1, 0.1, 0.1, 0.1, -0.1, 0.1, 0.1,
    // Back face
    -0.1, -0.1, -0.1, -0.1, 0.1, -0.1, 0.1, 0.1, -0.1,
    -0.1, -0.1, -0.1, 0.1, 0.1, -0.1, 0.1, -0.1, -0.1,
    // Left face
    -0.1, -0.1, -0.1, -0.1, -0.1, 0.1, -0.1, 0.1, 0.1,
    -0.1, -0.1, -0.1, -0.1, 0.1, 0.1, -0.1, 0.1, -0.1,
    // Right face
    0.1, -0.1, -0.1, 0.1, 0.1, -0.1, 0.1, 0.1, 0.1,
    0.1, -0.1, -0.1, 0.1, 0.1, 0.1, 0.1, -0.1, 0.1,
    // Top face
    -0.1, 0.1, -0.1, -0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
    -0.1, 0.1, -0.1, 0.1, 0.1, 0.1, 0.1, 0.1, -0.1,
    // Bottom face
    -0.1, -0.1, -0.1, 0.1, -0.1, -0.1, 0.1, -0.1, 0.1,
    -0.1, -0.1, -0.1, 0.1, -0.1, 0.1, -0.1, -0.1, 0.1
];

export const cubeColorGrid = [
    // Front face (red, green, blue for each vertex respectively)
    [1, 0, 0], [0, 1, 0], [0, 0, 1],
    [1, 0, 0], [0, 0, 1], [1, 1, 0],

    // Back face (cyan, magenta, yellow for each vertex respectively)
    [0, 1, 1], [1, 0, 1], [1, 1, 0],
    [0, 1, 1], [1, 1, 0], [0, 0, 1],

    // Left face (various shades of blue)
    [0, 0, 0.5], [0, 0, 1], [0, 0, 0.8],
    [0, 0, 0.5], [0, 0, 0.8], [0, 0, 0.2],

    // Right face (various shades of red)
    [0.5, 0, 0], [1, 0, 0], [0.8, 0, 0],
    [0.5, 0, 0], [0.8, 0, 0], [0.2, 0, 0],

    // Top face (various shades of green)
    [0, 0.5, 0], [0, 1, 0], [0, 0.8, 0],
    [0, 0.5, 0], [0, 0.8, 0], [0, 0.2, 0],

    // Bottom face (greys)
    [0.2, 0.2, 0.2], [0.5, 0.5, 0.5], [0.8, 0.8, 0.8],
    [0.2, 0.2, 0.2], [0.8, 0.8, 0.8], [0.3, 0.3, 0.3]
];

export const g_arm1Mesh = [
    // Front face
    -0.15, -0.05, -0.05, -0.05, -0.05, -0.05, -0.05, 0.3, -0.05,
    -0.15, -0.05, -0.05, -0.05, 0.3, -0.05, -0.15, 0.3, -0.05,

    // Back face
    -0.15, -0.05, 0.05, -0.15, 0.3, 0.05, -0.05, 0.3, 0.05,
    -0.15, -0.05, 0.05, -0.05, 0.3, 0.05, -0.05, -0.05, 0.05,

    // Left face (new extended side)
    -0.15, -0.05, -0.05, -0.15, 0.3, -0.05, -0.15, 0.3, 0.05,
    -0.15, -0.05, -0.05, -0.15, 0.3, 0.05, -0.15, -0.05, 0.05,

    // Right face (attached to cube)
    -0.05, -0.05, -0.05, -0.05, 0.3, -0.05, -0.05, 0.3, 0.05,
    -0.05, -0.05, -0.05, -0.05, 0.3, 0.05, -0.05, -0.05, 0.05,

    // Top face
    -0.15, 0.3, -0.05, -0.15, 0.3, 0.05, -0.05, 0.3, 0.05,
    -0.15, 0.3, -0.05, -0.05, 0.3, 0.05, -0.05, 0.3, -0.05,

    // Bottom face
    -0.15, -0.05, -0.05, -0.05, -0.05, -0.05, -0.05, -0.05, 0.05,
    -0.15, -0.05, -0.05, -0.05, -0.05, 0.05, -0.15, -0.05, 0.05
];

export const g_arm2Mesh = [
    // Front face
    0.05, -0.05, -0.05, 0.15, -0.05, -0.05, 0.15, 0.3, -0.05,
    0.05, -0.05, -0.05, 0.15, 0.3, -0.05, 0.05, 0.3, -0.05,

    // Back face
    0.05, -0.05, 0.05, 0.05, 0.3, 0.05, 0.15, 0.3, 0.05,
    0.05, -0.05, 0.05, 0.15, 0.3, 0.05, 0.15, -0.05, 0.05,

    // Left face (attached to cube)
    0.05, -0.05, -0.05, 0.05, 0.3, -0.05, 0.05, 0.3, 0.05,
    0.05, -0.05, -0.05, 0.05, 0.3, 0.05, 0.05, -0.05, 0.05,

    // Right face (new extended side)
    0.15, -0.05, -0.05, 0.15, 0.3, -0.05, 0.15, 0.3, 0.05,
    0.15, -0.05, -0.05, 0.15, 0.3, 0.05, 0.15, -0.05, 0.05,

    // Top face
    0.05, 0.3, -0.05, 0.05, 0.3, 0.05, 0.15, 0.3, 0.05,
    0.05, 0.3, -0.05, 0.15, 0.3, 0.05, 0.15, 0.3, -0.05,

    // Bottom face
    0.05, -0.05, -0.05, 0.15, -0.05, -0.05, 0.15, -0.05, 0.05,
    0.05, -0.05, -0.05, 0.15, -0.05, 0.05, 0.05, -0.05, 0.05
];


export const armVertexColors = [
    // Front face
    [1, 0, 0], [0, 1, 0], [0, 0, 1],
    [1, 0, 0], [0, 0, 1], [1, 1, 0],

    // Back face
    [0, 1, 1], [1, 0, 1], [1, 1, 0],
    [0, 1, 1], [1, 1, 0], [0, 0, 1],

    // Left face
    [0, 0, 0.5], [0, 0, 1], [0, 0, 0.8],
    [0, 0, 0.5], [0, 0, 0.8], [0, 0, 0.2],

    // Right face
    [0.5, 0, 0], [1, 0, 0], [0.8, 0, 0],
    [0.5, 0, 0], [0.8, 0, 0], [0.2, 0, 0],

    // Top face
    [0, 0.5, 0], [0, 1, 0], [0, 0.8, 0],
    [0, 0.5, 0], [0, 0.8, 0], [0, 0.2, 0],

    // Bottom face
    [0.2, 0.2, 0.2], [0.5, 0.5, 0.5], [0.8, 0.8, 0.8],
    [0.2, 0.2, 0.2], [0.8, 0.8, 0.8], [0.3, 0.3, 0.3]
];

// Function to generate vertices for a sphere
function generateSphereMesh(radius, segments) {
    const vertices = [];
    const colors = []; // Placeholder for vertex colors, adjust as needed

    for (let i = 0; i <= segments; i++) {
        let lat = Math.PI * (i / segments - 0.5);
        for (let j = 0; j <= segments; j++) {
            let lon = 2 * Math.PI * (j / segments);

            let x = radius * Math.cos(lat) * Math.cos(lon);
            let y = radius * Math.cos(lat) * Math.sin(lon);
            let z = radius * Math.sin(lat);

            vertices.push(x, y, z);

            // Example: Add color data, this is just an example and should be adjusted
            colors.push(
                Math.abs(Math.sin(lon)), // Red channel
                Math.abs(Math.cos(lon)), // Green channel
                Math.abs(Math.sin(lat))  // Blue channel
            );
        }
    }

    // Generate faces
    const indices = [];
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segments; j++) {
            let first = (i * (segments + 1)) + j;
            let second = first + segments + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return { vertices, indices, colors };
}

// Usage: create a sphere mesh with a specified radius and number of segments (detail level)
const sphereMesh = generateSphereMesh(1.0, 10); // Adjust radius and segments as needed

// Example usage in your mesh structure
export const g_sphereMesh = sphereMesh.vertices;
export const sphereColorGrid = sphereMesh.colors;