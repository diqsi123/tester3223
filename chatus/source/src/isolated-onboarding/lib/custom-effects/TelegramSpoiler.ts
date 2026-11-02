// @ts-nocheck

// Property metadata is only used in Figma Design, so this is a no-op.
function defineProperties(
  _component: unknown,
  _properties: unknown,
): void {}

export default function Effect() { }
export function setup(device, frame) {
    var wgsl = `
diagnostic(off,derivative_uniformity);
struct Uniforms {
  frameData: vec4f,
  inputDimsData: vec4f,
  bubbleColor: vec4f,
  particleColor: vec4f,
  particleDensity: vec4f,
  particleSize: vec4f,
  animationSpeed: vec4f,
  reveal: vec4f,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

struct VsIn {
  @location(0) pos: vec2f,
  @location(1) uv: vec2f,
};
struct VsOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

fn grainHash(p: vec2f) -> vec4f {

  var q = fract(vec4f(p.x, p.y, p.x, p.y) * vec4f(0.1031, 0.1030, 0.0973, 0.1099));

  q = q + dot(q, q.wzxy + vec4f(33.33));

  return fract((q.xxyz + q.yzzw) * q.zywx);

}

@vertex fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.position = vec4f(in.pos, 0.0, 1.0);
  out.uv = in.uv;
  return out;
}

@fragment fn fs_main(@location(0) outputUv_in: vec2f) -> @location(0) vec4f {
  let time = u.frameData.x;
  let outputUv = outputUv_in;
  let dims = max(u.frameData.yz, vec2f(1.0));
  let inputDims = max(u.inputDimsData.xy, vec2f(1.0));
  let inputTexel = vec2f(1.0) / inputDims;
  let uv = outputUv;
  // texel and aspect are input-relative to match uv. Zoom fills rescale texel
  // alongside their uv redefinition below (see zoomLocal).
  let texel = inputTexel;
  let aspect = inputDims.x / max(inputDims.y, 1.0);
  let bubbleColor = u.bubbleColor;
  let particleColor = u.particleColor;
  let particleDensity = u.particleDensity.x;
  let particleSize = u.particleSize.x;
  let animationSpeed = u.animationSpeed.x;
  let reveal = u.reveal.x;
  let progress = clamp(reveal / 100.0, 0.0, 1.0);
  let p = uv * dims;
  let spacing = 1.65;
  let cell = floor(p / spacing);
  let phase = time * animationSpeed * 0.78539816339;
  var grain = 0.0;
  for (var iy = -1; iy <= 1; iy = iy + 1) {
    for (var ix = -1; ix <= 1; ix = ix + 1) {
      let id = cell + vec2f(f32(ix), f32(iy));
      let seed = grainHash(id);
      let seed2 = grainHash(id + vec2f(71.1, 19.7));
      let angle = seed.z * 6.28318530718;
      let drift = vec2f(sin(phase + angle), cos(phase + angle + seed.w * 2.0)) * (0.20 + progress * 0.55);
      let centerPx = (id + vec2f(0.5) + (seed.xy - vec2f(0.5)) * 0.92) * spacing + drift;
      let delta = p - centerPx;
      let radius = particleSize * 0.5 * mix(0.65, 1.12, seed2.x) * (1.0 - progress * 0.6);
      let ellipseDelta = delta * vec2f(mix(0.85, 1.2, seed2.y), mix(0.85, 1.2, seed2.z));
      let distancePx = length(ellipseDelta);
      let footprint = 1.0 - smoothstep(max(0.0, radius - 0.38), radius + 0.38, distancePx);
      let enabled = 1.0 - smoothstep(max(0.0, particleDensity * (1.0 - progress) - 0.035), particleDensity * (1.0 - progress) + 0.035, seed.w);
      let shimmer = 0.62 + 0.22 * sin(phase * 2.0 + angle) + 0.12 * sin(phase * 3.0 + seed2.w * 6.28318530718);
      grain = max(grain, footprint * enabled * shimmer);
    }
  }
  grain = select(0.0, clamp(grain * particleColor.a * (1.0 - progress), 0.0, 1.0), particleDensity > 0.0);
  let rgb = mix(bubbleColor.rgb, particleColor.rgb, grain);
  let alpha = (1.0 - progress) * (1.0 + progress * grain);
  return select(vec4f(rgb, alpha), vec4f(0.0), progress >= 1.0);
}
`;
    frame.state.module = device.createShaderModule({ code: wgsl });
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
    frame.state.uniformBuf = device.createBuffer({
        size: 128,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
}
export function render(device, frame) {
    var params = frame.params || {};
    function finiteNumber(value, fallback) {
        var num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }
    function numberParam(name, fallback) {
        return finiteNumber(params[name], fallback);
    }
    function boolParam(name, fallback) {
        if (typeof params[name] === 'boolean')
            return params[name] ? 1 : 0;
        return fallback ? 1 : 0;
    }
    function selectParam(name, count, fallbackIndex) {
        // A select is a numeric dropdown: params[name] is the chosen option's index.
        var index = Math.round(Number(params[name]));
        return Number.isFinite(index) && index >= 0 && index < count ? index : fallbackIndex;
    }
    function colorParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.r, fallback[0]),
            finiteNumber(value.g, fallback[1]),
            finiteNumber(value.b, fallback[2]),
            finiteNumber(value.a, fallback[3]),
        ];
    }
    function pointParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
        ];
    }
    function pointRadiusParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
            finiteNumber(value.radius, fallback[2]),
        ];
    }
    function pointPointLineParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
            finiteNumber(value.x2, fallback[2]),
            finiteNumber(value.y2, fallback[3]),
        ];
    }
    function pointAngleRadiusParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
            finiteNumber(value.radius, fallback[2]),
            finiteNumber(value.angle, fallback[3]),
        ];
    }
    function colorPointParam(name, fallback) {
        var value = params[name] || {};
        var color = value.color || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
            0,
            0,
            finiteNumber(color.r, fallback[2]),
            finiteNumber(color.g, fallback[3]),
            finiteNumber(color.b, fallback[4]),
            finiteNumber(color.a, fallback[5]),
        ];
    }
    function gradientParam(name, fallback) {
        var value = params[name] || {};
        var stops = Array.isArray(value.stops) && value.stops.length > 0 ? value.stops : fallback;
        // Layout: 8 stop colors (rgba), then 8 positions packed 4-per-vec4, then the live count.
        var out = new Array(44).fill(0);
        var count = Math.min(stops.length, 8);
        for (var i = 0; i < count; i++) {
            var stop = stops[i] || {};
            var color = stop.color || {};
            out[i * 4] = finiteNumber(color.r, 0);
            out[i * 4 + 1] = finiteNumber(color.g, 0);
            out[i * 4 + 2] = finiteNumber(color.b, 0);
            out[i * 4 + 3] = finiteNumber(color.a, 1);
            out[32 + i] = finiteNumber(stop.position, 0);
        }
        out[40] = count;
        return out;
    }
    var output = frame.output || {};
    var width = Math.max(1, finiteNumber(output.width, 1));
    var height = Math.max(1, finiteNumber(output.height, 1));
    var time = finiteNumber(frame.time, 0) * 0.001;
    var inputWidth = width;
    var inputHeight = height;
    device.queue.writeBuffer(frame.state.uniformBuf, 0, new Float32Array([
        time, width, height, 0,
        inputWidth, inputHeight, 0, 0,
        ...colorParam("bubbleColor", [0.9, 0.96, 0.87, 1]),
        ...colorParam("particleColor", [0.22, 0.29, 0.2, 1]),
        numberParam("particleDensity", 0.8), 0, 0, 0,
        numberParam("particleSize", 0.7), 0, 0, 0,
        numberParam("animationSpeed", 1), 0, 0, 0,
        numberParam("reveal", 0), 0, 0, 0,
    ]));
    var outputFormat = frame.output.format;
    if (frame.state.pipeline == null || frame.state.pipelineFormat !== outputFormat) {
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
                targets: [{ format: outputFormat }],
            },
            primitive: { topology: 'triangle-list' },
        });
        frame.state.pipelineFormat = outputFormat;
    }
    var bindGroup = device.createBindGroup({
        layout: frame.state.pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: frame.state.uniformBuf } },
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
    "bubbleColor": {
        type: "color",
        label: "Bubble color",
        defaultValue: { "r": 0.9, "g": 0.96, "b": 0.87, "a": 1 },
    },
    "particleColor": {
        type: "color",
        label: "Particle color",
        defaultValue: { "r": 0.22, "g": 0.29, "b": 0.2, "a": 1 },
    },
    "particleDensity": {
        type: "number",
        label: "Particle density",
        defaultValue: 0.8,
        control: "slider",
        min: 0,
        max: 1,
        step: 0.01,
    },
    "particleSize": {
        type: "number",
        label: "Particle size",
        defaultValue: 0.7,
        control: "slider",
        min: 0.2,
        max: 1.4,
        step: 0.05,
        unit: "px",
    },
    "animationSpeed": {
        type: "number",
        label: "Animation speed",
        defaultValue: 1,
        control: "slider",
        min: 0,
        max: 3,
        step: 0.05,
    },
    "reveal": {
        type: "number",
        label: "Reveal",
        defaultValue: 0,
        control: "slider",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
});

export const manifest = {
  "version": 2,
  "name": "Telegram Spoiler",
  "isAnimated": true,
  "usesMouse": false
}

