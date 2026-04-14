import { describe, expect, it } from "vitest";
import { schedulePromise } from "./promise";

describe("schedulePromise", () => {
  it("returns undefined and settles rejected promises without throwing", async () => {
    const p = Promise.reject(new Error("fail"));
    expect(schedulePromise(p)).toBeUndefined();
    await new Promise((r) => setTimeout(r, 0));
  });

  it("returns undefined for fulfilled promises", async () => {
    const p = Promise.resolve(1);
    expect(schedulePromise(p)).toBeUndefined();
    await p;
  });
});
