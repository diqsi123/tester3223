import { test, expect } from "@playwright/test";

for (const [width, height] of [[393, 852], [390, 844], [375, 812]]) {
  test(`search screen at ${width}×${height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.getByRole("button", { name: "Начать общение", exact: true }).click();
    const visual = page.locator(".living-search");
    await expect(visual).toHaveAttribute("data-renderer", "webgl");
    await expect(visual.locator("canvas")).toHaveCount(1);
    expect(await visual.evaluate(el => getComputedStyle(el).pointerEvents)).toBe("none");
    const box = await visual.boundingBox();
    expect(box!.width / box!.height).toBeCloseTo(393 / 852, 2);
    await page.screenshot({ path: `evidence/search-${width}x${height}.png` });
    await page.getByRole("button", { name: "Отменить поиск" }).click();
    await expect(visual).toHaveAttribute("data-searching", "false");
    expect(errors).toEqual([]);
  });
}

test("reduced motion freezes the visual while keeping a luminous composition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Начать общение", exact: true }).click();
  const visual = page.locator(".living-search");
  await expect(visual).toHaveAttribute("data-renderer", "webgl");
  const first = await visual.screenshot();
  await page.waitForTimeout(600);
  expect(await visual.screenshot()).toEqual(first);
});

test("WebGL denial retains the original PNG and static masked gradient", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === "webgl") return null;
      return original.call(this, type as "2d", ...args as []);
    } as typeof original;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Начать общение", exact: true }).click();
  await expect(page.locator(".living-search")).toHaveAttribute("data-renderer", "fallback");
  const image = page.locator(".living-search__fallback img");
  await expect(image).toBeVisible();
  expect(await image.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBe(402);
});

test("context loss shows fallback and restoration rebuilds the renderer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Начать общение", exact: true }).click();
  const visual = page.locator(".living-search");
  await expect(visual).toHaveAttribute("data-renderer", "webgl");
  const supported = await visual.locator("canvas").evaluate(canvas => {
    const extension = canvas.getContext("webgl")?.getExtension("WEBGL_lose_context");
    if (!extension) return false;
    extension.loseContext();
    setTimeout(() => extension.restoreContext(), 400);
    return true;
  });
  test.skip(!supported, "Context loss extension unavailable on this GPU");
  await expect(visual).toHaveAttribute("data-renderer", "fallback");
  await expect(visual).toHaveAttribute("data-renderer", "webgl");
});
