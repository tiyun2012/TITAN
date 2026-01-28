export const VS = `#version 300 es
layout(location=0) in vec3 a_pos;
uniform mat4 u_viewProj;
uniform mat4 u_model;
void main() {
  gl_Position = u_viewProj * u_model * vec4(a_pos, 1.0);
}`;
export const FS = `#version 300 es
precision mediump float;
uniform vec4 u_color;
out vec4 outColor;
void main() {
  outColor = u_color;
}`;
