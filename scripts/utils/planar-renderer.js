// How to use:
// - create a reflection entity with a camera component, set up its layers to what you want to reflect.
// - add the planarRenderer script to it, set the sceneCameraEntity to the main camera of the scene.
// - call frameUpdate on the script to update the reflection texture. This needs to be called
//   after the main camera properties including the transform has been set already.
// Note: Objects that use the reflected texture cannot be in the layers the reflection camera renders.
var PlanarRenderer = pc.createScript('planarRenderer');

PlanarRenderer.attributes.add('sceneCameraEntity', {
    type: 'entity',
    description: 'The entity containing the main camera of the scene.'
});

PlanarRenderer.attributes.add('scale', {
    title: 'Scale',
    description: 'Scale of the texture compared to the render buffer of the main camera.',
    type: 'number',
    default: 0.5
});

PlanarRenderer.attributes.add('mipmaps', {
    title: 'Mipmaps',
    description: 'If set to true, mipmaps will be and autogenerated.',
    type: 'boolean',
    default: false
});

PlanarRenderer.attributes.add('depth', {
    title: 'Depth',
    description: 'If set to true, depth buffer will be created.',
    type: 'boolean',
    default: true
});

PlanarRenderer.attributes.add('planePoint', {
    type: 'vec3',
    default: [0, 0, 0],
    title: 'Plane Point',
    description: 'Point on a reflection plane.'
});

PlanarRenderer.attributes.add('planeNormal', {
    type: 'vec3',
    default: [0, 1, 0],
    title: 'Plane Normal',
    description: 'Normal of a reflection plane.'
});

// initialize code called once per entity
PlanarRenderer.prototype.initialize = function () {

    this.plane = new pc.Plane();
    this.reflectionMatrix = new pc.Mat4();

    // sceneCameraEntity needs to be set
    var sceneCamera = this.sceneCameraEntity.camera;
    if (!sceneCamera) {
        console.error('PlanarRenderer component requires cameraEntity attribute to be set.');
        return;
    }

    // this entity needs to have camera component as well
    var planarCamera = this.entity.camera;
    if (!planarCamera) {
        console.error('PlanarRenderer component requires a camera component on the same entity.');
        return;
    }

    // When the camera is finished rendering, trigger onPlanarPostRender event on the entity.
    // This can be listened to by the user, and the resulting texture can be further processed (e.g prefiltered)
    this.evtPostRender = this.app.scene.on('postrender', (cameraComponent) => {
        if (planarCamera === cameraComponent) {
            this.entity.fire('onPlanarPostRender');
        }
    });

    // when the script is destroyed, remove event listeners
    this.on('destroy', () => {
        this.evtPostRender.off();
    });
};

PlanarRenderer.prototype.updateRenderTarget = function () {

    // main camera resolution
    var sceneCamera = this.sceneCameraEntity.camera;
    var sceneCameraWidth = sceneCamera.renderTarget?.width ?? this.app.graphicsDevice.width;
    var sceneCameraHeight = sceneCamera.renderTarget?.height ?? this.app.graphicsDevice.height;

    // reflection texture resolution
    var width = Math.floor(sceneCameraWidth * this.scale);
    var height = Math.floor(sceneCameraHeight * this.scale);

    // limit maximum texture size
    width = Math.min(width, this.app.graphicsDevice.maxTextureSize);
    height = Math.min(height, this.app.graphicsDevice.maxTextureSize);

    var planarCamera = this.entity.camera;
    if (!planarCamera.renderTarget || planarCamera.renderTarget.width !== width || planarCamera.renderTarget.height !== height) {

        // destroy old render target
        if (planarCamera.renderTarget) {
            this.texture.destroy();
            planarCamera.renderTarget.destroy();
        }

        // Create texture render target with specified resolution and mipmap generation
        this.texture = new pc.Texture(this.app.graphicsDevice, {
            name: `${this.entity.name}:PlanarRenderer-`,
            width: width,
            height: height,
            format: pc.PIXELFORMAT_SRGBA8,
            mipmaps: this.mipmaps,
            addressU: pc.ADDRESS_CLAMP_TO_EDGE,
            addressV: pc.ADDRESS_CLAMP_TO_EDGE,
            minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
            magFilter: pc.FILTER_LINEAR
        });

        // render target
        var renderTarget = new pc.RenderTarget({
            colorBuffer: this.texture,
            depth: this.depth
        });

        planarCamera.renderTarget = renderTarget;
    }
};

PlanarRenderer.prototype.frameUpdate = function () {

    this.updateRenderTarget();

    var planarCamera = this.entity.camera;
    if (planarCamera.enabled) {

        // update reflection camera orientation by mirroring the scene camera by the plane
        this.plane.setFromPointNormal(this.planePoint, this.planeNormal);
        this.reflectionMatrix.setReflection(this.plane.normal, this.plane.distance);

        var pos = this.sceneCameraEntity.getPosition();
        var reflectedPos = this.reflectionMatrix.transformPoint(pos);

        var target = pos.clone().add(this.sceneCameraEntity.forward);
        var reflectedTarget = this.reflectionMatrix.transformPoint(target);

        this.entity.setPosition(reflectedPos);
        this.entity.lookAt(reflectedTarget);

        // copy other properties from the scene camera
        var sceneCamera = this.sceneCameraEntity.camera;
        planarCamera.fov = sceneCamera.fov;
        planarCamera.orthoHeight = sceneCamera.orthoHeight;
        planarCamera.nearClip = sceneCamera.nearClip;
        planarCamera.farClip = sceneCamera.farClip;
        planarCamera.aperture = sceneCamera.aperture;
        planarCamera.sensitivity = sceneCamera.sensitivity;
        planarCamera.shutter = sceneCamera.shutter;

        return this.texture;
    }

    return null;
};
