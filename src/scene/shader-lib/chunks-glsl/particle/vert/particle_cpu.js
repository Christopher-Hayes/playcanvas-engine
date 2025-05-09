export default /* glsl */`
attribute vec4 particle_vertexData;   // XYZ = world pos, W = life
attribute vec4 particle_vertexData2;  // X = angle, Y = scale, Z = alpha, W = velocity.x
attribute vec4 particle_vertexData3;  // XYZ = particle local pos, W = velocity.y
attribute float particle_vertexData4; // particle id

// type depends on useMesh property. Start with X = velocity.z, Y = particle ID and for mesh particles proceeds with Z = mesh UV.x, W = mesh UV.y
// Note: This generates a duplicate attribute warning, as the scanning we do is very simple.
#ifndef USE_MESH
    attribute vec2 particle_vertexData5;
#else
    attribute vec4 particle_vertexData5;
#endif

uniform mat4 matrix_viewProjection;
uniform mat4 matrix_model;

#ifndef VIEWMATRIX
    #define VIEWMATRIX
    uniform mat4 matrix_view;
#endif

uniform mat3 matrix_normal;
uniform mat4 matrix_viewInverse;

uniform float numParticles;
uniform float lifetime;
uniform float stretch;
uniform float seed;
uniform vec3 wrapBounds;
uniform vec3 emitterScale;
uniform vec3 faceTangent;
uniform vec3 faceBinorm;

#ifdef PARTICLE_GPU
    uniform highp sampler2D internalTex0;
    uniform highp sampler2D internalTex1;
    uniform highp sampler2D internalTex2;
#endif
uniform vec3 emitterPos;

varying vec4 texCoordsAlphaLife;

vec2 rotate(vec2 quadXY, float pRotation, out mat2 rotMatrix)
{
    float c = cos(pRotation);
    float s = sin(pRotation);
    //vec4 rotationMatrix = vec4(c, -s, s, c);

    mat2 m = mat2(c, -s, s, c);
    rotMatrix = m;

    return m * quadXY;
}

vec3 billboard(vec3 InstanceCoords, vec2 quadXY)
{
    vec3 pos = -matrix_viewInverse[0].xyz * quadXY.x + -matrix_viewInverse[1].xyz * quadXY.y;
    return pos;
}

vec3 customFace(vec3 InstanceCoords, vec2 quadXY)
{
    vec3 pos = faceTangent * quadXY.x + faceBinorm * quadXY.y;
    return pos;
}

void main(void)
{
    vec3 particlePos = particle_vertexData.xyz;
    vec3 inPos = particlePos;
    vec3 vertPos = particle_vertexData3.xyz;
    vec3 inVel = vec3(particle_vertexData2.w, particle_vertexData3.w, particle_vertexData5.x);

    float id = floor(particle_vertexData4);
    float rndFactor = fract(sin(id + 1.0 + seed));
    vec3 rndFactor3 = vec3(rndFactor, fract(rndFactor*10.0), fract(rndFactor*100.0));

#ifdef LOCAL_SPACE
    inVel = mat3(matrix_model) * inVel;
#endif
    vec2 velocityV = normalize((mat3(matrix_view) * inVel).xy); // should be removed by compiler if align/stretch is not used

    vec2 quadXY = vertPos.xy;

#ifdef USE_MESH
    texCoordsAlphaLife = vec4(particle_vertexData5.zw, particle_vertexData2.z, particle_vertexData.w);
#else
    texCoordsAlphaLife = vec4(quadXY * -0.5 + 0.5, particle_vertexData2.z, particle_vertexData.w);
#endif
    mat2 rotMatrix;

    float inAngle = particle_vertexData2.x;
    vec3 particlePosMoved = vec3(0.0);
    vec3 meshLocalPos = particle_vertexData3.xyz;
`;
