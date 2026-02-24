import { expect, test } from "@playwright/test";

test("opengraph image endpoints return PNG images", async ({ request }) => {
  const ogPaths = [
    "/opengraph-image",
    "/atf/opengraph-image",
    "/receipts/opengraph-image",
    "/launch/opengraph-image",
  ];

  for (const path of ogPaths) {
    const response = await request.get(path);
    expect(response.status(), `${path} should return 200`).toBe(200);

    const contentType = response.headers()["content-type"] ?? "";
    expect(contentType.startsWith("image/"), `${path} should return image content`).toBe(true);
  }
});
