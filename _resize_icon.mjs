import sharp from "sharp";

const src = "images/TruCore-favicon.png";
// Background matches the site's dark bg (#0a0a14)
const bg = { r: 10, g: 10, b: 20, alpha: 1 };

// 512x512 for app/icon.png (max size, PWA/Android/Apple)
await sharp(src)
  .resize(512, 512, { fit: "contain", background: bg })
  .png()
  .toFile("app/icon.png");
console.log("app/icon.png -> 512x512");

// 48x48 for public/favicon.png (browser tab)
await sharp(src)
  .resize(48, 48, { fit: "contain", background: bg })
  .png()
  .toFile("public/favicon.png");
console.log("public/favicon.png -> 48x48");
