import faviconSource from "../public/favicon.svg?raw";
import indexHtml from "../index.html?raw";

it("declares the site favicon in index.html", () => {
  expect(indexHtml).toContain('href="/favicon.svg"');
  expect(faviconSource).toContain("rect");
  expect(faviconSource).toContain("path");
});
