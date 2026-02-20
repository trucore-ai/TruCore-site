import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { primerMeta, primerSections } from "@/lib/primer-content";

export const runtime = "nodejs";

/* ── Colour palette ── */
const HEADING_COLOR = rgb(0.94, 0.63, 0.31); // #f0a050
const BODY_COLOR = rgb(0.2, 0.2, 0.22);
const BULLET_COLOR = rgb(0.3, 0.3, 0.33);
const FOOTER_COLOR = rgb(0.45, 0.45, 0.5);
const ACCENT_LINE = rgb(0.94, 0.63, 0.31);

/* ── Layout constants ── */
const PAGE_W = 612; // US Letter
const PAGE_H = 792;
const MARGIN_X = 60;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const TOP_Y = PAGE_H - 60;
const BOTTOM_Y = 60;

/**
 * Wrap text into lines that fit within maxWidth at the given fontSize using
 * the provided font.
 */
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

export async function GET() {
  const doc = await PDFDocument.create();
  doc.setTitle(`${primerMeta.title} - TruCore`);
  doc.setSubject(primerMeta.subtitle);
  doc.setProducer("TruCore");

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = TOP_Y;

  /* ── Helper: add footer to a page ── */
  function drawFooter(p: typeof page) {
    // Accent line
    p.drawLine({
      start: { x: MARGIN_X, y: BOTTOM_Y + 18 },
      end: { x: PAGE_W - MARGIN_X, y: BOTTOM_Y + 18 },
      thickness: 0.5,
      color: ACCENT_LINE,
      opacity: 0.3,
    });
    p.drawText(primerMeta.footerLine, {
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

  /* ── Helper: ensure enough vertical space, add new page if needed ── */
  function ensureSpace(needed: number) {
    if (y - needed < BOTTOM_Y + 30) {
      drawFooter(page);
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = TOP_Y;
    }
  }

  /* ── Helper: draw wrapped body text ── */
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

  /* ── Helper: draw a bullet item ── */
  function drawBullet(text: string) {
    const fontSize = 10.5;
    const lineHeight = 15;
    const bulletIndent = 14;
    const textIndent = 26;
    const lines = wrapText(
      text,
      fontRegular,
      fontSize,
      CONTENT_W - textIndent,
    );
    for (let i = 0; i < lines.length; i++) {
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

  /* ══════════════════════════════════════════
     PAGE 1: HEADER
     ══════════════════════════════════════════ */

  // TruCore header
  page.drawText("TruCore", {
    x: MARGIN_X,
    y,
    size: 14,
    font: fontBold,
    color: HEADING_COLOR,
  });
  y -= 36;

  // Title
  page.drawText(primerMeta.title, {
    x: MARGIN_X,
    y,
    size: 28,
    font: fontBold,
    color: BODY_COLOR,
  });
  y -= 26;

  // Subtitle
  page.drawText(primerMeta.subtitle, {
    x: MARGIN_X,
    y,
    size: 14,
    font: fontRegular,
    color: FOOTER_COLOR,
  });
  y -= 12;

  // Accent rule
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_W - MARGIN_X, y },
    thickness: 1,
    color: ACCENT_LINE,
    opacity: 0.5,
  });
  y -= 28;

  /* ══════════════════════════════════════════
     SECTIONS
     ══════════════════════════════════════════ */

  for (const section of primerSections) {
    // Section heading
    ensureSpace(40);
    page.drawText(section.heading, {
      x: MARGIN_X,
      y,
      size: 16,
      font: fontBold,
      color: HEADING_COLOR,
    });
    y -= 22;

    // Paragraphs
    if (section.paragraphs) {
      for (const p of section.paragraphs) {
        drawBody(p);
        y -= 6;
      }
    }

    // Bullets
    if (section.bullets) {
      for (const b of section.bullets) {
        drawBullet(b);
        y -= 2;
      }
    }

    y -= 12;
  }

  /* ── Callout ── */
  ensureSpace(40);
  page.drawLine({
    start: { x: MARGIN_X, y: y + 4 },
    end: { x: PAGE_W - MARGIN_X, y: y + 4 },
    thickness: 0.5,
    color: ACCENT_LINE,
    opacity: 0.3,
  });
  y -= 8;
  drawBody(primerMeta.callout, 4);
  y -= 12;

  /* ── Closing ── */
  ensureSpace(30);
  page.drawText("Apply: trucore.xyz/#waitlist", {
    x: MARGIN_X,
    y,
    size: 11,
    font: fontBold,
    color: HEADING_COLOR,
  });

  // Draw footer on every page
  const pages = doc.getPages();
  for (const p of pages) {
    // Only draw footer if it hasn't been drawn (last page handled here)
    if (p === page) {
      drawFooter(p);
    }
  }

  const pdfBytes = await doc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="ATF-Primer-TruCore.pdf"',
      "Cache-Control": "public, max-age=86400",
    },
  });
}
