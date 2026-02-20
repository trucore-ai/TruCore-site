import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { whitepaperMeta, whitepaperSections } from "@/lib/whitepaper-content";

const HEADING_COLOR = rgb(0.94, 0.63, 0.31);
const BODY_COLOR = rgb(0.2, 0.2, 0.22);
const BULLET_COLOR = rgb(0.3, 0.3, 0.33);
const FOOTER_COLOR = rgb(0.45, 0.45, 0.5);
const ACCENT_LINE = rgb(0.94, 0.63, 0.31);

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 60;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const TOP_Y = PAGE_H - 60;
const BOTTOM_Y = 60;

function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  fontSize: number,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, fontSize);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines;
}

export async function generateWhitepaperPdfBytes(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${whitepaperMeta.title} - TruCore`);
  doc.setSubject(whitepaperMeta.subtitle);
  doc.setProducer("TruCore");

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = TOP_Y;

  function drawFooter(p: typeof page) {
    p.drawLine({
      start: { x: MARGIN_X, y: BOTTOM_Y + 18 },
      end: { x: PAGE_W - MARGIN_X, y: BOTTOM_Y + 18 },
      thickness: 0.5,
      color: ACCENT_LINE,
      opacity: 0.3,
    });

    p.drawText(whitepaperMeta.footerLine, {
      x: MARGIN_X,
      y: BOTTOM_Y,
      size: 9,
      font: fontRegular,
      color: FOOTER_COLOR,
    });

    const pageNum = `${doc.getPageCount()}`;
    const numWidth = fontRegular.widthOfTextAtSize(pageNum, 9);
    p.drawText(pageNum, {
      x: PAGE_W - MARGIN_X - numWidth,
      y: BOTTOM_Y,
      size: 9,
      font: fontRegular,
      color: FOOTER_COLOR,
    });
  }

  function ensureSpace(needed: number) {
    if (y - needed < BOTTOM_Y + 30) {
      drawFooter(page);
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = TOP_Y;
    }
  }

  function drawBody(text: string, indent = 0) {
    const fontSize = 10.5;
    const lineHeight = 15;
    const lines = wrapText(text, fontRegular, fontSize, CONTENT_W - indent);

    for (const line of lines) {
      ensureSpace(lineHeight);
      page.drawText(line, {
        x: MARGIN_X + indent,
        y,
        size: fontSize,
        font: fontRegular,
        color: BODY_COLOR,
      });
      y -= lineHeight;
    }
  }

  function drawBullet(text: string) {
    const fontSize = 10.5;
    const lineHeight = 15;
    const bulletIndent = 14;
    const textIndent = 26;
    const lines = wrapText(text, fontRegular, fontSize, CONTENT_W - textIndent);

    for (let i = 0; i < lines.length; i += 1) {
      ensureSpace(lineHeight);
      if (i === 0) {
        page.drawCircle({
          x: MARGIN_X + bulletIndent,
          y: y - 3,
          size: 2.5,
          color: ACCENT_LINE,
        });
      }

      page.drawText(lines[i], {
        x: MARGIN_X + textIndent,
        y,
        size: fontSize,
        font: fontRegular,
        color: BULLET_COLOR,
      });
      y -= lineHeight;
    }
  }

  page.drawText("TruCore", {
    x: MARGIN_X,
    y,
    size: 14,
    font: fontBold,
    color: HEADING_COLOR,
  });
  y -= 36;

  page.drawText(whitepaperMeta.title, {
    x: MARGIN_X,
    y,
    size: 26,
    font: fontBold,
    color: BODY_COLOR,
  });
  y -= 26;

  page.drawText(whitepaperMeta.subtitle, {
    x: MARGIN_X,
    y,
    size: 13,
    font: fontRegular,
    color: FOOTER_COLOR,
  });
  y -= 12;

  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_W - MARGIN_X, y },
    thickness: 1,
    color: ACCENT_LINE,
    opacity: 0.5,
  });
  y -= 24;

  for (const section of whitepaperSections) {
    ensureSpace(40);
    page.drawText(section.heading, {
      x: MARGIN_X,
      y,
      size: 16,
      font: fontBold,
      color: HEADING_COLOR,
    });
    y -= 22;

    if (section.paragraphs) {
      for (const paragraph of section.paragraphs) {
        drawBody(paragraph);
        y -= 6;
      }
    }

    if (section.bullets) {
      for (const bullet of section.bullets) {
        drawBullet(bullet);
        y -= 2;
      }
    }

    y -= 10;
  }

  ensureSpace(28);
  page.drawText("Apply: trucore.xyz/atf/apply", {
    x: MARGIN_X,
    y,
    size: 11,
    font: fontBold,
    color: HEADING_COLOR,
  });

  drawFooter(page);
  return doc.save();
}
