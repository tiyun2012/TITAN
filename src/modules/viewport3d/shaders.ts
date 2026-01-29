export const VS = `#version 300 es
precision highp float;

layout(location=0) in vec3 aPos;

uniform mat4 uMVP;

void main(){
  gl_Position = uMVP * vec4(aPos, 1.0);
}
`;

export const FS = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec4 uColor;
void main(){
  outColor = uColor;
}
`;
