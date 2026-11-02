// Missing declarations in the current DOM lib, without modifying the copied Figma runtime.
declare const GPUTextureUsage: {
  readonly COPY_SRC: 1;
  readonly COPY_DST: 2;
  readonly TEXTURE_BINDING: 4;
  readonly STORAGE_BINDING: 8;
  readonly RENDER_ATTACHMENT: 16;
};
interface HTMLCanvasElement {
  getContext(contextId: "webgpu"): GPUCanvasContext | null;
}
