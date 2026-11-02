// @ts-nocheck

// Property metadata is only used in Figma Design, so this is a no-op.
function defineProperties(
  _component: unknown,
  _properties: unknown,
): void {}

// Bokeh Blur
// Brightness-weighted disc gather that blooms highlights into bokeh discs.
// Authors: Patricio González Vivo, Felix Faire
export default function Effect() { }
export function setup(device, frame) {
    var WGSL = `
diagnostic(off,derivative_uniformity);

struct U {
  // x: radius(px), y: density, z: pad, w: pad
  v0: vec4f,
};
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var samp: sampler;
@group(0) @binding(2) var input: texture_2d<f32>;

struct VsIn {
  @location(0) pos: vec2f,
  @location(1) uv: vec2f,
};
struct VsOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.position = vec4f(in.pos, 0.0, 1.0);
  out.uv = in.uv;
  return out;
}

const GOLDEN_ANGLE: f32 = 2.39996323;
// Hard upper bound so the sample loop has compile-time-constant bounds. The
// live sample count (density * radius) is clamped to this and exited early.
const MAX_SAMPLES: i32 = 512;

fn rot(t: f32) -> mat2x2f {
  let c = cos(t);
  let s = sin(t);
  return mat2x2f(c, -s, s, c);
}

// Premultiplied sample that returns transparent (premultiplied zero) outside
// the input rect rather than a clamped edge texel. Modyfi samples with zero'd
// edges; clamping here would smear the border into the bokeh.
fn sampleZero(uv: vec2f) -> vec4f {
  let inside = step(vec2f(0.0), uv) * step(uv, vec2f(1.0));
  return textureSampleLevel(input, samp, uv, 0.0) * inside.x * inside.y;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let dims = vec2f(textureDimensions(input, 0));
  let cocRadius = max(u.v0.x / 10.0, 0.0);
  let density = max(u.v0.y, 0.0001);
  let kernelSize = clamp(density * cocRadius, 1.0, f32(MAX_SAMPLES));

  // Brightness weighting: bright/opaque samples count for more, blooming
  // highlights into bokeh discs. Contrast scales with the defocus radius.
  let contrastAmount = 1.0 + 2.0 * cocRadius;
  let contrastFactor = vec3f(2.0);
  let smoothFactor = 2.0;
  let rot2 = rot(GOLDEN_ANGLE);

  var dir = vec2f(0.0, 0.74 * cocRadius / sqrt(kernelSize));
  var reciprocal = 1.0;
  var color = vec4f(0.0);
  var weight = vec4f(0.0);

  for (var i = 0; i < MAX_SAMPLES; i = i + 1) {
    if (f32(i) >= kernelSize) {
      break;
    }
    reciprocal = reciprocal + 1.0 / reciprocal;
    dir = rot2 * dir;
    let offset = (reciprocal - 1.0) * dir;     // pixel-space spiral offset
    let col = sampleZero(uv + offset / dims);  // pixels -> uv
    let bokehMult = vec4f(smoothFactor + pow(col.rgb, contrastFactor) * contrastAmount, 1.0) * col.a;
    color = color + col * bokehMult;
    weight = weight + bokehMult;
  }

  // Guard against a zero-weight (fully transparent) neighbourhood -> NaN.
  return color / max(weight, vec4f(0.0001));
}
`;
    frame.state.module = device.createShaderModule({ code: WGSL });
    frame.state.pipeline = null;
    frame.state.pipelineFormat = null;
    frame.state.quad = device.createBuffer({
        size: 6 * 4 * 4,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });
    new Float32Array(frame.state.quad.getMappedRange()).set([
        -1, -1, 0, 1,
        1, -1, 1, 1,
        -1, 1, 0, 0,
        -1, 1, 0, 0,
        1, -1, 1, 1,
        1, 1, 1, 0,
    ]);
    frame.state.quad.unmap();
    // 1 vec4f = 16 bytes.
    frame.state.uniformBuf = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    frame.state.sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
    });
    // 1x1 transparent placeholder keeps the bind group valid if input is null.
    frame.state.placeholder = device.createTexture({
        size: [1, 1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture({ texture: frame.state.placeholder }, new Uint8Array([0, 0, 0, 0]), { bytesPerRow: 4 }, { width: 1, height: 1, depthOrArrayLayers: 1 });
}
export function render(device, frame) {
    if (frame.state.pipeline == null || frame.state.pipelineFormat !== frame.output.format) {
        frame.state.pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: frame.state.module,
                entryPoint: 'vs_main',
                buffers: [{
                        arrayStride: 16,
                        attributes: [
                            { shaderLocation: 0, format: 'float32x2', offset: 0 },
                            { shaderLocation: 1, format: 'float32x2', offset: 8 },
                        ],
                    }],
            },
            fragment: {
                module: frame.state.module,
                entryPoint: 'fs_main',
                targets: [{ format: frame.output.format }],
            },
            primitive: { topology: 'triangle-list' },
        });
        frame.state.pipelineFormat = frame.output.format;
    }
    var params = frame.params || {};
    function finiteNumber(value, fallback) {
        var num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }
    function numberParam(name, fallback) {
        return finiteNumber(params[name], fallback);
    }
    device.queue.writeBuffer(frame.state.uniformBuf, 0, new Float32Array([
        numberParam('radius', 24), numberParam('density', 6), 0, 0,
    ]));
    var inputView = frame.input != null
        ? frame.input.createView()
        : frame.state.placeholder.createView();
    var bindGroup = device.createBindGroup({
        layout: frame.state.pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: frame.state.uniformBuf } },
            { binding: 1, resource: frame.state.sampler },
            { binding: 2, resource: inputView },
        ],
    });
    var encoder = device.createCommandEncoder();
    var pass = encoder.beginRenderPass({
        colorAttachments: [{
                view: frame.output.createView(),
                loadOp: 'clear',
                clearValue: { r: 0, g: 0, b: 0, a: 0 },
                storeOp: 'store',
            }],
    });
    pass.setPipeline(frame.state.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, frame.state.quad);
    pass.draw(6);
    pass.end();
    device.queue.submit([encoder.finish()]);
}
defineProperties(Effect, {
    radius: {
        type: "number",
        label: "Radius",
        defaultValue: 24,
        control: "slider",
        min: 0,
        max: 500,
        step: 1,
        unit: "px",
    },
    density: {
        type: "number",
        label: "Density",
        defaultValue: 6,
        control: "slider",
        min: 1,
        max: 20,
        step: 0.1,
    },
});

export const manifest = {
  "name": "Bokeh blur",
  "version": 2,
  "isAnimated": false,
  "usesMouse": false
}
