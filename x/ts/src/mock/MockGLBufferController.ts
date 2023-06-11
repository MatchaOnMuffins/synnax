import { vi } from "vitest";

import { GLBufferController } from "..";

export class MockGLBufferController implements GLBufferController {
  ARRAY_BUFFER: number = 1;
  STATIC_DRAW: number = 2;
  DYNAMIC_DRAW: number = 3;

  targets: Record<number, number> = {};
  counter: number = 0;
  buffers: Record<number, ArrayBuffer> = {};

  createBufferMock = vi.fn();
  bufferDataMock = vi.fn();
  bufferSubDataMock = vi.fn();
  bindBufferMock = vi.fn();

  createBuffer(): WebGLBuffer | null {
    this.createBufferMock();
    const v = ++this.counter;
    this.buffers[v] = new ArrayBuffer(0);
    return v;
  }

  bufferData(
    target: number,
    dataOrSize: ArrayBufferLike | number,
    usage: number
  ): void {
    if (typeof dataOrSize === "number")
      this.buffers[this.targets[target]] = new ArrayBuffer(dataOrSize);
    else this.buffers[this.targets[target]] = dataOrSize;

    this.bufferDataMock(target, dataOrSize, usage);
  }

  bindBuffer(target: number, buffer: WebGLBuffer | null): void {
    if (buffer === 0) throw new Error("Cannot bind to 0");
    this.targets[target] = buffer as number;
    this.bindBufferMock(target, buffer);
  }

  bufferSubData(target: number, offset: number, data: ArrayBufferLike): void {
    let buffer = this.buffers[this.targets[target]];
    if (buffer == null) {
      buffer = new ArrayBuffer(offset + data.byteLength);
      this.buffers[target] = buffer;
    }
    const view = new Uint8Array(buffer);
    view.set(new Uint8Array(data), offset);
    this.bufferSubDataMock(target, offset, data);
  }
}