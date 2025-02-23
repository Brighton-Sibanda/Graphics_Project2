// Last edited by Brighton Sibanda 2025
// Helper functions for project 1 to make things more spread out

// Utils.js

export const VSHADER_SOURCE = `
    attribute vec3 a_Position;
    uniform mat4 u_Model;
    uniform mat4 u_World;
    attribute vec3 a_Color;
    uniform mat4 u_Projection;
    varying vec3 v_Color;
    void main() {
        gl_Position = u_Projection * u_World * u_Model * vec4(a_Position, 1.0);
        v_Color = a_Color;
    }
`;

export const FSHADER_SOURCE = `
    varying mediump vec3 v_Color;
    void main() {
        gl_FragColor = vec4(v_Color, 1.0);
    }
`;

export function buildColorAttributes(vertex_count, color) {
    var colors = [];
    for (var i = 0; i < vertex_count; i++) {
        colors.push(color[0], color[1], color[2]);
    }
    return colors;
}

export function initVBO(gl, data) {
    var VBOloc = gl.createBuffer();
    if (!VBOloc) return false;

    gl.bindBuffer(gl.ARRAY_BUFFER, VBOloc);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    return true;
}

export function setupVec3(gl, name, stride, offset) {
    var attributeID = gl.getAttribLocation(gl.program, name);
    if (attributeID < 0) {
        console.log(`Failed to get the storage location of ${name}`);
        return false;
    }

    gl.vertexAttribPointer(attributeID, 3, gl.FLOAT, false, stride, offset);
    gl.enableVertexAttribArray(attributeID);

    return true;
}

export function buildTerrainColors(terrain, height) {
    var colors = []
    for (var i = 0; i < terrain.length; i++) {
        // calculates the vertex color for each vertex independent of the triangle
        // the rasterizer can help make this look "smooth"

        // we use the y axis of each vertex alone for color
        // higher "peaks" have more shade
        var shade = (terrain[i][1] / height) + 1/2
        var color = [shade, shade, 1.0]

        // give each triangle 3 colors
        colors.push(...color)
    }

    return colors
}

export function buildPerVertex(colors) {
    var colorAttributes = [];
    colors.forEach(color => {
        // Push each color component to the attribute array
        colorAttributes.push(color[0], color[1], color[2]);
    });
    return colorAttributes;
}