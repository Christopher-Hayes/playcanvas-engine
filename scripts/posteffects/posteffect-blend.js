// --------------- POST EFFECT DEFINITION --------------- //
/**
 * @class
 * @name BlendEffect
 * @classdesc Blends the input render target with another texture.
 * @description Creates new instance of the post effect.
 * @augments PostEffect
 * @param {GraphicsDevice} graphicsDevice - The graphics device of the application.
 * @property {Texture} blendMap The texture with which to blend the input render target with.
 * @property {number} mixRatio The amount of blending between the input and the blendMap. Ranges from 0 to 1.
 */
function BlendEffect(graphicsDevice) {
    pc.PostEffect.call(this, graphicsDevice);

    var fshader = [
        'uniform float uMixRatio;',
        'uniform sampler2D uColorBuffer;',
        'uniform sampler2D uBlendMap;',
        '',
        'varying vec2 vUv0;',
        '',
        'void main(void)',
        '{',
        '    vec4 texel1 = texture2D(uColorBuffer, vUv0);',
        '    vec4 texel2 = texture2D(uBlendMap, vUv0);',
        '    gl_FragColor = mix(texel1, texel2, uMixRatio);',
        '}'
    ].join('\n');

    this.shader = pc.ShaderUtils.createShader(graphicsDevice, {
        uniqueName: 'BlendShader',
        attributes: { aPosition: pc.SEMANTIC_POSITION },
        vertexGLSL: pc.PostEffect.quadVertexShader,
        fragmentGLSL: fshader
    });

    // Uniforms
    this.mixRatio = 0.5;
    this.blendMap = new pc.Texture(graphicsDevice);
    this.blendMap.name = 'pe-blend';
}

BlendEffect.prototype = Object.create(pc.PostEffect.prototype);
BlendEffect.prototype.constructor = BlendEffect;

Object.assign(BlendEffect.prototype, {
    render: function (inputTarget, outputTarget, rect) {
        var device = this.device;
        var scope = device.scope;

        scope.resolve('uMixRatio').setValue(this.mixRatio);
        scope.resolve('uColorBuffer').setValue(inputTarget.colorBuffer);
        scope.resolve('uBlendMap').setValue(this.blendMap);
        this.drawQuad(outputTarget, this.shader, rect);
    }
});

// ----------------- SCRIPT DEFINITION ------------------ //
var Blend = pc.createScript('blend');

Blend.attributes.add('mixRatio', {
    type: 'number',
    default: 0.5,
    min: 0,
    max: 1,
    title: 'Mix Ratio'
});

Blend.attributes.add('blendMap', {
    type: 'asset',
    assetType: 'texture',
    title: 'Blend Map'
});

Blend.prototype.initialize = function () {
    this.effect = new BlendEffect(this.app.graphicsDevice);
    this.effect.mixRatio = this.mixRatio;
    if (this.blendMap) {
        this.effect.blendMap = this.blendMap.resource;
    }

    var queue = this.entity.camera.postEffects;

    queue.addEffect(this.effect);

    this.on('state', function (enabled) {
        if (enabled) {
            queue.addEffect(this.effect);
        } else {
            queue.removeEffect(this.effect);
        }
    });

    this.on('destroy', function () {
        queue.removeEffect(this.effect);
    });

    this.on('attr:mixRatio', function (value) {
        this.effect.mixRatio = value;
    }, this);

    this.on('attr:blendMap', function (value) {
        this.effect.blendMap = value ? value.resource : null;
    }, this);
};
