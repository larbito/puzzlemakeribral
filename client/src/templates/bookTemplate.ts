// Shared book template generator
// ------------------------------------------------------
// This helper returns full HTML (string) for the ENTIRE book using the
// same CSS + structure regardless of whether we show it in the Preview
// component (inside an iframe) or rasterise it to PDF (html2canvas + jsPDF).
// Keeping a single source of truth ensures that the preview and exported
// PDF look identical.
// ------------------------------------------------------

import { BookContent, KDPBookSettings } from '@/pages/dashboard/KDPBookFormatter';

export function generateBookHTML(
  book: BookContent,
  settings: KDPBookSettings
): string {
  const {
    title,
    chapters,
    metadata: { author = '', publisher = '', year = new Date().getFullYear().toString(), isbn = '' }
  } = book;

  // Inline CSS – MUST match what we use in PDF generator
  const css = `
    <style>
      @page { margin: 0; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; }

      /* Page wrapper */
      .page {
        width: ${settings.trimSize.startsWith('8.5') ? '816px' : '576px'}; /* 96ppi approximation */
        height: ${settings.trimSize.startsWith('8.5') ? '1056px' : '864px'};
        margin: 0 auto;
        padding: 96px 72px; /* 1in top/bottom, 0.75in left/right */
        font-family: ${settings.fontFamily === 'Times New Roman' ? 'Times, "Times New Roman", serif' : settings.fontFamily};
        font-size: ${settings.fontSize}pt;
        line-height: ${settings.lineSpacing};
        position: relative;
      }
      .page-break { page-break-after: always; }

      h1.title { font-size: 2.2em; text-align: center; margin-top: 40%; letter-spacing: 1px; text-transform: uppercase; }
      h2.subtitle { font-size: 1.3em; text-align: center; margin-top: 1em; font-style: italic; }
      p.author { text-align: center; margin-top: 2em; font-size: 1em; }
      p.publisher { text-align: center; margin-top: 1em; font-size: 0.9em; color: #666; }

      /* TOC */
      .toc h2 { text-align: center; margin-bottom: 2em; text-transform: uppercase; }
      .toc-entry { display:flex; justify-content:space-between; margin-bottom:0.5em; }

      /* Chapter */
      h2.chapter-title { text-align:center; text-transform: uppercase; margin:0 auto 1.5em; font-size:1.4em; }
      .chapter-number { text-align:center; margin-bottom:0.8em; font-size:0.9em; color:#666; }
      p { text-align:justify; margin-bottom:1em; }
      p.indent { text-indent:1.3em; }
      p.no-indent { text-indent:0; }

      /* Copyright page */
      .copyright { font-size: 0.8em; line-height: 1.4; }
      .copyright p { margin-bottom: 0.8em; text-align: left; }
    </style>
  `;

  // Helper to wrap content in a page div
  const wrap = (inner: string) => `<div class="page">${inner}</div><div class="page-break"></div>`;

  // 1. Half-title & Title pages
  let html = css;
  html += wrap(`<h1 class="title">${title}</h1>`);

  html += wrap(`
    <h1 class="title">${title}</h1>
    <p class="author">${author}</p>
    ${publisher ? `<p class="publisher">${publisher}</p>` : ''}
  `);

  // 2. Copyright page with metadata
  const copyrightContent = `
    <div class="copyright" style="margin-top:40%">
      <p>© ${year} ${author || 'Author'}</p>
      ${publisher ? `<p>Published by ${publisher}</p>` : ''}
      ${isbn ? `<p>ISBN: ${isbn}</p>` : ''}
      <p>All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.</p>
    </div>
  `;
  html += wrap(copyrightContent);

  // 3. Blank page for verso
  html += wrap('');

  // 4. Table of contents (if >1 chapter)
  if (chapters.length > 1 && settings.includeTOC) {
    const entries = chapters
      .map((ch, idx) => `<div class="toc-entry"><span>Chapter ${idx + 1}: ${ch.title}</span><span>${idx + 5}</span></div>`) // naive page num
      .join('');
    html += wrap(`<div class="toc"><h2>Table of Contents</h2>${entries}</div>`);
  }

  // 5. Chapters
  chapters.forEach((ch, idx) => {
    const paragraphs = ch.content.split(/\n\n+/).map((p, i) => {
      const cls = i === 0 ? 'no-indent' : 'indent';
      return `<p class="${cls}">${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
    }).join('');

    const chapterHTML = `
      ${chapters.length > 1 ? `<div class="chapter-number">Chapter ${idx + 1}</div>` : ''}
      ${chapters.length > 1 ? `<h2 class="chapter-title">${ch.title}</h2>` : ''}
      ${paragraphs}
    `;
    html += wrap(chapterHTML);
  });

  return html;
} 