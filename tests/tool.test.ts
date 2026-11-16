import { describe, it, expect } from 'vitest';
import { executeSynthesizedPipeline, processInput, SYNTHESIZED_PIPELINE } from '../src/tool.ts';

describe('JSON Viewer Synthesized Contract', () => {
  it('exposes the proven DeepCoder pipeline steps', () => {
    expect(SYNTHESIZED_PIPELINE).toEqual(["parseJson","stringifyCanonical"]);
  });

  it('satisfies training specification #1', () => {
    const out = executeSynthesizedPipeline("{\"b\": 1, \"a\": 2}");
    expect(out).toEqual("{\"a\":2,\"b\":1}");
    const ui = processInput("{\"b\": 1, \"a\": 2}");
    expect(ui.success).toBe(true);
    expect(ui.data).toBe("{\"a\":2,\"b\":1}");
  });

  it('satisfies training specification #2', () => {
    const out = executeSynthesizedPipeline("{\"z\": true, \"m\": 3}");
    expect(out).toEqual("{\"m\":3,\"z\":true}");
    const ui = processInput("{\"z\": true, \"m\": 3}");
    expect(ui.success).toBe(true);
    expect(ui.data).toBe("{\"m\":3,\"z\":true}");
  });

  it('satisfies unseen holdout specification #1', () => {
    const out = executeSynthesizedPipeline("{\"y\": 9, \"x\": 1}");
    expect(out).toEqual("{\"x\":1,\"y\":9}");
  });

  it('produces deterministic results across repeated calls', () => {
    const sample = "{\"b\": 1, \"a\": 2}";
    expect(executeSynthesizedPipeline(sample)).toEqual(executeSynthesizedPipeline(sample));
  });
});
