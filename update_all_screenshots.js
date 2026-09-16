const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'code_screenshots', 'pages');

console.log('Starting batch theme update for all files in:', pagesDir);

const files = fs.readdirSync(pagesDir);
let htmlCount = 0;
let svgCount = 0;

// Helper to extract file metadata
function getFileMeta(fileName) {
  // e.g. Admin_part1.html -> name: Admin, part: 1
  const partMatch = fileName.match(/^([A-Za-z0-9]+)_part(\d+)\.(html|svg)$/);
  if (partMatch) {
    return { baseName: partMatch[1], part: partMatch[2], isPart: true, ext: partMatch[3] };
  }
  const fullMatch = fileName.match(/^([A-Za-z0-9]+)\.(html|svg)$/);
  if (fullMatch) {
    return { baseName: fullMatch[1], part: null, isPart: false, ext: fullMatch[2] };
  }
  return null;
}

// -------------------------------------------------------------
// 1. PROCESS PART SVG FILES
// -------------------------------------------------------------
function updatePartSvg(filePath, meta) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already updated
  if (content.includes('id="bgGrad"') && content.includes('class="gutter"')) {
    return false;
  }

  // Extract dimensions
  const vbMatch = content.match(/viewBox="0 0 (\d+) (\d+)"/);
  const width = vbMatch ? vbMatch[1] : '1100';
  const height = vbMatch ? vbMatch[2] : '2300';
  const gutterHeight = parseInt(height, 10) - 46;

  // Extract title text
  const titleMatch = content.match(/<text [^>]*class="title"[^>]*>([^<]+)<\/text>/);
  let title = titleMatch ? titleMatch[1] : `microfinance/src/pages/${meta.baseName}.jsx (Part ${meta.part})`;
  if (!title.startsWith('microfinance/')) {
    title = 'microfinance/' + title.replace(/^src\//, 'src/');
  }

  const badgeText = `PAGE COMPONENT · PART ${meta.part}`;

  // Build modern SVG header definition
  const defsAndHeader = `  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <style>
      .bg { fill: url(#bgGrad); }
      .header { fill: #151e33; }
      .gutter { fill: #0b0f19; }
      .border { stroke: rgba(255, 255, 255, 0.12); stroke-width: 1; fill: none; }
      .line-div { stroke: rgba(255, 255, 255, 0.08); stroke-width: 1; }
      .text-num { fill: #64748b; font-family: 'Fira Code', monospace; font-size: 13px; text-anchor: end; }
      .text-code { fill: #cbd5e1; font-family: 'Fira Code', monospace; font-size: 13.5px; white-space: pre; }
      .title { fill: #cbd5e1; font-family: 'Fira Code', monospace; font-size: 13px; font-weight: 600; }
      .c-kw { fill: #f43f5e; font-weight: 600; }
      .c-fn { fill: #60a5fa; }
      .c-str { fill: #34d399; }
      .c-cmt { fill: #64748b; font-style: italic; }
      .c-tag { fill: #38bdf8; }
      .c-attr { fill: #e5c07b; }
      .c-num { fill: #f59e0b; }
    </style>
  </defs>

  <rect width="${width}" height="${height}" rx="12" class="bg"/>
  <rect width="${width}" height="46" rx="12" class="header"/>
  <rect width="${width}" height="${height}" rx="12" class="border"/>
  
  <circle cx="24" cy="23" r="6" fill="#ff5f56"/>
  <circle cx="44" cy="23" r="6" fill="#ffbd2e"/>
  <circle cx="64" cy="23" r="6" fill="#27c93f"/>
  <text x="96" y="28" class="title">${title}</text>
  <rect x="${parseInt(width, 10) - 230}" y="13" width="205" height="20" rx="4" fill="rgba(56,189,248,0.15)" stroke="rgba(56,189,248,0.4)" stroke-width="1"/>
  <text x="${parseInt(width, 10) - 128}" y="27" font-family="'Fira Code', monospace" font-size="10" font-weight="700" fill="#38bdf8" text-anchor="middle">${badgeText}</text>
  <line x1="0" y1="46" x2="${width}" y2="46" class="line-div"/>
  <rect x="0" y="46" width="60" height="${gutterHeight}" class="gutter"/>
  <line x1="60" y1="46" x2="60" y2="${height}" class="line-div"/>`;

  // Replace everything from <defs> to <g id="code-body">
  const codeBodyIndex = content.indexOf('<g id="code-body">');
  if (codeBodyIndex !== -1) {
    const svgOpenTagMatch = content.match(/<svg[^>]+>/);
    if (svgOpenTagMatch) {
      content = svgOpenTagMatch[0] + '\n' + defsAndHeader + '\n\n  ' + content.slice(codeBodyIndex);
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  }
  return false;
}

// -------------------------------------------------------------
// 2. PROCESS FULL SVG FILES (e.g. Clients.svg, Dashboard.svg)
// -------------------------------------------------------------
function updateFullSvg(filePath, meta) {
  let content = fs.readFileSync(filePath, 'utf8');

  // If already updated
  if (content.includes('id="bgGrad"') && content.includes('#151e33')) {
    return false;
  }

  // Check if it's the GitHub dark style with <rect x="0" y="0" width="980" height="42" fill="#161b22"
  if (content.includes('fill="#161b22"') || content.includes('background:#0d1117')) {
    const vbMatch = content.match(/viewBox="0 0 (\d+) (\d+)"/);
    const width = vbMatch ? vbMatch[1] : '980';
    const height = vbMatch ? vbMatch[2] : '5000';

    const titleMatch = content.match(/<text [^>]*class="hdr"[^>]*>([^<]+)<\/text>/);
    let title = titleMatch ? titleMatch[1] : `microfinance/src/pages/${meta.baseName}.jsx`;
    // Clean "(X lines)" if present
    const cleanTitle = title.replace(/\s*\(\d+\s*lines\)/i, '').trim();

    content = content.replace(/background:#0d1117/, 'background:#070a13');

    // Replace defs
    const oldDefsMatch = content.match(/<defs>[\s\S]*?<\/defs>/);
    if (oldDefsMatch) {
      const newDefs = `<defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <style>
      .kw { fill: #f43f5e; font-weight: 600; }
      .fn { fill: #60a5fa; }
      .str { fill: #34d399; }
      .num { fill: #f59e0b; }
      .cm { fill: #64748b; font-style: italic; }
      .tag { fill: #38bdf8; }
      .attr { fill: #e5c07b; }
      .ln { fill: #64748b; text-anchor: end; user-select: none; }
      .txt { fill: #cbd5e1; }
      .hdr { fill: #cbd5e1; font-size: 13px; font-weight: 600; }
    </style>
  </defs>`;
      content = content.replace(oldDefsMatch[0], newDefs);
    }

    // Replace header rect & dots
    const oldHeaderRegex = /<rect x="0" y="0" width="\d+" height="42" fill="#161b22"[^>]*>[\s\S]*?<text [^>]*class="hdr"[^>]*>[^<]+<\/text>/;
    const newHeader = `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGrad)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  <rect x="0" y="0" width="${width}" height="46" fill="#151e33"/>
  <line x1="0" y1="46" x2="${width}" y2="46" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <circle cx="24" cy="23" r="6" fill="#ff5f56"/>
  <circle cx="44" cy="23" r="6" fill="#ffbd2e"/>
  <circle cx="64" cy="23" r="6" fill="#27c93f"/>
  <text x="96" y="28" class="hdr">${cleanTitle}</text>
  <rect x="${parseInt(width, 10) - 220}" y="13" width="195" height="20" rx="4" fill="rgba(56,189,248,0.15)" stroke="rgba(56,189,248,0.4)" stroke-width="1"/>
  <text x="${parseInt(width, 10) - 123}" y="27" font-family="'Fira Code', monospace" font-size="10" font-weight="700" fill="#38bdf8" text-anchor="middle">PAGE COMPONENT · FULL VIEW</text>`;

    content = content.replace(oldHeaderRegex, newHeader);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  // Handle case where it used .bg { fill: #1e1e1e; }
  if (content.includes('.bg { fill: #1e1e1e; }')) {
    return updatePartSvg(filePath, meta);
  }

  return false;
}

// -------------------------------------------------------------
// 3. PROCESS PART HTML FILES
// -------------------------------------------------------------
function updatePartHtml(filePath, meta) {
  let content = fs.readFileSync(filePath, 'utf8');

  // If already has theme.css and capture-outer
  if (content.includes('href="theme.css"') && content.includes('capture-outer') && content.includes('btn-theme-previous')) {
    return false;
  }

  // 1. Add theme.css link in <head>
  if (!content.includes('href="theme.css"')) {
    content = content.replace('</head>', '  <link rel="stylesheet" href="theme.css">\n</head>');
  }

  // 2. Ensure container has id="page-container"
  content = content.replace('<div class="container">', '<div class="container" id="page-container">');

  // 3. Add theme switcher into .actions
  if (!content.includes('btn-theme-previous')) {
    const themeSwitcherHtml = `<div class="theme-switcher">
          <button class="theme-btn active" id="btn-theme-previous" onclick="setTheme('previous')">🌌 Previous Folder</button>
          <button class="theme-btn" id="btn-theme-light" onclick="setTheme('light')">☀️ Light</button>
        </div>\n        `;
    content = content.replace('<div class="actions">\n        <button onclick="copyCode()', '<div class="actions">\n        ' + themeSwitcherHtml + '<button onclick="copyCode()');
    content = content.replace('<div class="actions">\n      <button onclick="copyCode()', '<div class="actions">\n      ' + themeSwitcherHtml + '<button onclick="copyCode()');
  }

  // 4. Update window card and header
  if (!content.includes('class="capture-outer"')) {
    // Replace <div class="window-card" id="capture-area"> and its header
    const oldWindowHeaderRegex = /<div class="window-card" id="capture-area">[\s\S]*?<div class="window-header">[\s\S]*?<\/div>[\s\S]*?<div class="code-container">/;
    const badgeText = `PAGE COMPONENT · PART ${meta.part} · 100L`;

    const newWindowHeader = `<div class="capture-outer" id="capture-area">
      <div class="window-card">
        <div class="window-header">
          <div class="window-header-left">
            <div class="traffic-lights">
              <div class="dot dot-red"></div>
              <div class="dot dot-yellow"></div>
              <div class="dot dot-green"></div>
            </div>
            <div class="window-title">microfinance/src/pages/${meta.baseName}.jsx</div>
          </div>
          <div class="pill-badge">${badgeText}</div>
        </div>
        <div class="code-container">`;

    content = content.replace(oldWindowHeaderRegex, newWindowHeader);

    // Add closing </div> for capture-outer before <script>
    const preScriptRegex = /(<\/pre>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*)(<script>)/;
    if (!preScriptRegex.test(content)) {
      content = content.replace(/(<\/pre>\s*<\/div>\s*<\/div>\s*<\/div>\s*)(<script>)/, '$1  </div>\n\n  $2');
    }
  }

  // 5. Update script with setTheme and dynamic background in takeScreenshot
  if (!content.includes('function setTheme(')) {
    const scriptReplacement = `    let currentTheme = 'previous';

    function setTheme(theme) {
      currentTheme = theme;
      const pageContainer = document.getElementById('page-container');
      const btnPrev = document.getElementById('btn-theme-previous');
      const btnLight = document.getElementById('btn-theme-light');
      
      if (theme === 'light') {
        pageContainer.classList.add('theme-light');
        btnLight.classList.add('active');
        btnPrev.classList.remove('active');
      } else {
        pageContainer.classList.remove('theme-light');
        btnPrev.classList.add('active');
        btnLight.classList.remove('active');
      }
    }

    function copyCode() {
      const code = document.getElementById('code-content').textContent;
      navigator.clipboard.writeText(code);
      alert('Code copied to clipboard!');
    }

    function takeScreenshot() {
      const area = document.getElementById('capture-area');
      const bg = currentTheme === 'light' ? '#f1f5f9' : '#070a13';
      html2canvas(area, { backgroundColor: bg, scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = \`${meta.baseName}_Part${meta.part}_\${currentTheme}.png\`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }`;

    // Replace existing copyCode and takeScreenshot functions
    const oldFuncsRegex = /function copyCode\(\)[\s\S]*?function takeScreenshot\(\)[\s\S]*?\}\s*<\/script>/;
    if (oldFuncsRegex.test(content)) {
      content = content.replace(oldFuncsRegex, scriptReplacement + '\n  </script>');
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

// -------------------------------------------------------------
// 4. PROCESS FULL HTML FILES (e.g. Loans.html, Admin.html)
// -------------------------------------------------------------
function updateFullHtml(filePath, meta) {
  let content = fs.readFileSync(filePath, 'utf8');

  let changed = false;

  // 1. Ensure theme.css is linked
  if (!content.includes('href="theme.css"')) {
    content = content.replace('</head>', '  <link rel="stylesheet" href="theme.css">\n</head>');
    changed = true;
  }

  // 2. If it has toolbar, ensure Previous Folder theme elements
  if (content.includes('class="toolbar"') && !content.includes('btn-theme-previous')) {
    const themeSwitcherHtml = `<div class="theme-switcher">
        <button class="theme-btn active" id="btn-theme-previous" onclick="setTheme('previous')">🌌 Previous Folder</button>
        <button class="theme-btn" id="btn-theme-light" onclick="setTheme('light')">☀️ Light</button>
      </div>`;
    content = content.replace('<div class="toolbar">', `<div class="toolbar" id="page-container">\n    ${themeSwitcherHtml}`);
    changed = true;
  }

  // 3. Ensure setTheme exists in script
  if (!content.includes('function setTheme(')) {
    const scriptAddition = `\n    let currentTheme = 'previous';
    function setTheme(theme) {
      currentTheme = theme;
      const target = document.querySelector('.code-container, .code-card, #capture-target');
      const btnPrev = document.getElementById('btn-theme-previous');
      const btnLight = document.getElementById('btn-theme-light');
      if (theme === 'light') {
        document.body.classList.add('theme-light');
        if (target) target.classList.add('theme-light');
        if (btnLight) btnLight.classList.add('active');
        if (btnPrev) btnPrev.classList.remove('active');
      } else {
        document.body.classList.remove('theme-light');
        if (target) target.classList.remove('theme-light');
        if (btnPrev) btnPrev.classList.add('active');
        if (btnLight) btnLight.classList.remove('active');
      }
    }\n`;

    if (content.includes('<script>')) {
      content = content.replace('<script>', '<script>' + scriptAddition);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// MAIN LOOP OVER ALL FILES IN pages/
// -------------------------------------------------------------
for (const file of files) {
  const filePath = path.join(pagesDir, file);
  const meta = getFileMeta(file);

  if (!meta) continue;

  if (meta.ext === 'svg') {
    if (meta.isPart) {
      if (updatePartSvg(filePath, meta)) {
        svgCount++;
        console.log(`[SVG Part Updated] ${file}`);
      }
    } else {
      if (updateFullSvg(filePath, meta)) {
        svgCount++;
        console.log(`[SVG Full Updated] ${file}`);
      }
    }
  } else if (meta.ext === 'html') {
    if (meta.isPart) {
      if (updatePartHtml(filePath, meta)) {
        htmlCount++;
        console.log(`[HTML Part Updated] ${file}`);
      }
    } else {
      if (updateFullHtml(filePath, meta)) {
        htmlCount++;
        console.log(`[HTML Full Updated] ${file}`);
      }
    }
  }
}

console.log(`\nCompleted! Total updated: ${htmlCount} HTML files, ${svgCount} SVG files.`);
