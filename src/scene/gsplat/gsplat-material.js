import { CULLFACE_NONE, SEMANTIC_ATTR13, SEMANTIC_POSITION } from '../../platform/graphics/constants.js';
import { BLEND_NONE, BLEND_PREMULTIPLIED, DITHER_NONE } from '../constants.js';
import { ShaderMaterial } from '../materials/shader-material.js';
import { shaderChunksWGSL } from '../shader-lib/chunks-wgsl/chunks-wgsl.js';
import { shaderChunks } from '../shader-lib/chunks-glsl/chunks.js';

/**
 * @typedef {object} SplatMaterialOptions - The options.
 * @property {string} [vertex] - Custom vertex shader, see SPLAT MANY example.
 * @property {string} [fragment] - Custom fragment shader, see SPLAT MANY example.
 * @property {string[]} [defines] - List of shader defines.
 * @property {Object<string, string>} [chunks] - Custom shader chunks.
 * @property {string} [dither] - Opacity dithering enum.
 *
 * @ignore
 */

/**
 * @param {SplatMaterialOptions} [options] - The options.
 * @returns {ShaderMaterial} The GS material.
 */
const createGSplatMaterial = (options = {}) => {

    const ditherEnum = options.dither ?? DITHER_NONE;
    const dither = ditherEnum !== DITHER_NONE;

    const material = new ShaderMaterial({
        uniqueName: 'SplatMaterial',
        vertexGLSL: options.vertex ?? shaderChunks.gsplatVS,
        fragmentGLSL: options.fragment ?? shaderChunks.gsplatPS,
        vertexWGSL: shaderChunksWGSL.gsplatVS,
        fragmentWGSL: shaderChunksWGSL.gsplatPS,
        attributes: {
            vertex_position: SEMANTIC_POSITION,
            vertex_id_attrib: SEMANTIC_ATTR13
        }
    });

    material.setDefine(`DITHER_${ditherEnum.toUpperCase()}`, '');

    material.cull = CULLFACE_NONE;
    material.blendType = dither ? BLEND_NONE : BLEND_PREMULTIPLIED;
    material.depthWrite = dither;
    material.update();

    return material;
};

export { createGSplatMaterial };
