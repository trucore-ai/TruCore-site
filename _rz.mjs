import sharp from "sharp";
const bg = { r: 10, g: 10, b: 20, alpha: 1 };
await sharp("images/TruCore-favicon.png").resize(512, 512, { fit: "contain", background: bg }).png().toFile("app/icon.png");
console.log("app/icon.png -> 512x512");
await sharp("images/TruCore-favicon.png").resize(48, 48, { fit: "contain", background: bg }).png().toFile("public/favicon.png");
console.log("public/favicon.png -> 48x48");
