// ============================================================
// Jellyfish Observation Station
// Israel Aquarium × Bezalel Academy
// sketch.js — pure vanilla JS, no dependencies
// ============================================================

// ── Canvas setup ─────────────────────────────────────────────
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

// Internal design resolution — all coordinates use these values
const W = 1920;
const H = 1080;

// Canvas is always 1920×1080 internally.
// CSS scales it visually to fit any screen — no coordinate math needed.
canvas.width  = W;
canvas.height = H;

function resize() {
  let s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width  = (W * s) + 'px';
  canvas.style.height = (H * s) + 'px';
}
window.addEventListener('resize', resize);
resize();

// Convert a screen-pixel coordinate to internal 1920×1080 coordinate
function toDesign(screenX, screenY) {
  let rect = canvas.getBoundingClientRect();
  return {
    x: (screenX - rect.left) * (W / rect.width),
    y: (screenY - rect.top)  * (H / rect.height)
  };
}

// ── State machine ─────────────────────────────────────────────
// States: WELCOME | DRAWING | LOADING | GALLERY
let state        = 'WELCOME';
let currentPhase = 1;          // 1, 2, or 3
let drawings     = [[], [], []]; // drawings[phase][pathIndex][{x,y}]
let database     = [];           // all submitted jellyfish
let isPointerDown = false;

// ── Colors ────────────────────────────────────────────────────
const C_LILAC = 'rgb(156,161,209)';
const C_WHITE = 'rgb(255,255,255)';
const C_GRAY  = 'rgb(160,160,160)';
const C_DIM   = 'rgb(90,90,90)';   // bounding box outline
const C_BLACK = 'rgb(0,0,0)';

// ── Fonts ─────────────────────────────────────────────────────
const F = (weight, size) => `${weight} ${size}px Abraham`;
const F_REG  = (sz) => F(400, sz);
const F_BOLD = (sz) => F(700, sz);

// ── Icon size ─────────────────────────────────────────────────
const ICON_D  = 85;
const HIT_R   = 60; // hit radius for icons

// ── Gallery grid (hex offset pattern) ────────────────────────
const GRID_COLS  = 5;
const GRID_ROWS  = 4;
const HEX_OFFSET = 0.5;

// ── Gallery animation: cycle phases every 0.75s at 60fps ─────
const PHASE_FRAMES = 45;
let   frameCount   = 0;

// ── Loading screen duration (4 seconds at 60fps) ─────────────
const LOADING_FRAMES = 240;
let   loadingCounter = 0;

// ── Drawing bounding box ──────────────────────────────────────
function boxBounds() {
  let bw = W * 0.52;
  let bh = H * 0.50;
  let bx = (W - bw) / 2;
  let by = H * 0.05;
  return { bx, by, bw, bh };
}

// ── Column layout (Welcome, Drawing, Loading screens) ─────────
// Three columns of 500px each
// Centers: EN=330, AR=960, HE=1590
const COL_W    = 500;
const COL_EN_C = 330;
const COL_AR_C = 960;
const COL_HE_C = 1590;

// ── Trilingual instruction copy ──────────────────────────────
const PHASE_TEXT = [
  {
    he: 'התבוננו במדוזה. ציירו אותה כשהיא קטנה ועגולה. השתמשו בעיפרון האפור.',
    ar: 'راقب قنديل البحر. ارسمه عندما يكون صغيراً ومستديراً. استخدم القلم الرمادي.',
    en: 'Watch the jellyfish. Draw it when it is small and round. Use the gray pen.'
  },
  {
    he: 'כעת ציירו את המדוזה כשהיא מתחילה להתרחב.',
    ar: 'الآن ارسم قنديل البحر وهو يبدأ في التوسع.',
    en: 'Now draw the jellyfish as it begins to expand.'
  },
  {
    he: 'לסיים, ציירו את המדוזה כשהיא שטוחה לחלוטין וצפה.',
    ar: 'أخيراً، ارسم قنديل البحر وهو مسطح تماماً وعائم.',
    en: 'Finally, draw the jellyfish when it is fully flat and floating.'
  }
];

// ── Jellyfish image ───────────────────────────────────────────
const jellyImg = new Image();
jellyImg.src   = 'Jellyfish_Assets-01.png';

// ── Wait for fonts before first draw ─────────────────────────
document.fonts.ready.then(() => { requestAnimationFrame(loop); });

// ============================================================
// MAIN LOOP
// ============================================================
function loop() {
  frameCount++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Black background
  ctx.fillStyle = C_BLACK;
  ctx.fillRect(0, 0, W, H);

  if      (state === 'WELCOME') drawWelcome();
  else if (state === 'DRAWING') drawDrawingScreen();
  else if (state === 'LOADING') drawLoading();
  else if (state === 'GALLERY') drawGallery();

  requestAnimationFrame(loop);
}

// ============================================================
// TEXT HELPERS
// All text uses ctx directly in internal coordinate space.
// ============================================================

// Wrapped text block
// x, y = top-left corner of text box
// maxW = wrap width
// align: 'left' | 'center' | 'right'
// dir:   'ltr'  | 'rtl'
function drawText(str, x, y, maxW, fontStr, color, align, dir) {
  ctx.save();
  ctx.font      = fontStr;
  ctx.fillStyle = color;
  ctx.direction = dir   || 'ltr';
  ctx.textAlign = align || 'left';

  let sz    = parseFloat(fontStr);
  let lineH = sz * 1.65;
  let curY  = y + sz; // first baseline

  // X anchor depends on alignment
  let anchorX;
  if (align === 'center') anchorX = x + maxW / 2;
  else if (align === 'right') anchorX = x + maxW;
  else anchorX = x;

  // Word-wrap
  let words = str.split(' ');
  let line  = '';
  for (let w of words) {
    let test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, anchorX, curY);
      line  = w;
      curY += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, anchorX, curY);
  ctx.restore();
}

// Single line, centered on a point
function drawTextCentered(str, cx, cy, fontStr, color, dir) {
  ctx.save();
  ctx.font      = fontStr;
  ctx.fillStyle = color;
  ctx.direction = dir || 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, cx, cy);
  ctx.restore();
}

// ============================================================
// TRILINGUAL COLUMN BLOCK
// Three side-by-side columns: EN (left), AR (middle), HE (right)
// colTop = top Y of the text area
// ============================================================
function drawTrilingualColumns(colTop, fontFn, sz,
                                enStr, arStr, heStr,
                                enColor, arColor, heColor) {
  // English — LTR, center-aligned within column
  drawText(enStr,
    COL_EN_C - COL_W / 2, colTop, COL_W,
    fontFn(sz), enColor || C_GRAY, 'center', 'ltr');

  // Arabic — RTL, center-aligned within column
  drawText(arStr,
    COL_AR_C - COL_W / 2, colTop, COL_W,
    fontFn(sz), arColor || C_GRAY, 'center', 'rtl');

  // Hebrew — RTL, center-aligned within column
  drawText(heStr,
    COL_HE_C - COL_W / 2, colTop, COL_W,
    fontFn(sz), heColor || C_WHITE, 'center', 'rtl');
}

// ============================================================
// SCREEN 1 — WELCOME
// ============================================================
function drawWelcome() {
  // ── Titles ────────────────────────────────────────────────
  // Hebrew — Lilac, Bold 60px, RTL, centered
  drawText('תחנת תצפית מדוזות',
    W / 2 - 500, 90, 1000, F_BOLD(60), C_LILAC, 'center', 'rtl');

  // Arabic — White, Bold 60px, RTL, centered
  drawText('محطة مراقبة قنديل البحر',
    W / 2 - 500, 175, 1000, F_BOLD(60), C_WHITE, 'center', 'rtl');

  // English — Gray, Bold 60px, LTR, centered
  drawText('Jellyfish Observation Station',
    W / 2 - 500, 260, 1000, F_BOLD(60), C_GRAY, 'center', 'ltr');

  // ── Three-column paragraphs ───────────────────────────────
  drawTrilingualColumns(
    400, F_REG, 20,
    'The Israel Aquarium researches jellyfish reproduction. Anya, a Visual Communications student at Bezalel, created her own \'Reproduction Project\' for a scientific illustration course. You can participate by adding your jellyfish. There is no right or wrong: every observation is unique, and together we create something beautiful.',
    'يقوم الأكواريوم الإسرائيلي بالبحث في عملية تكاثر قناديل البحر. أنيا، طالبة الاتصالات المرئية في بتسلئيل، أنشأت \'مشروع التكاثر\' كجزء من مساق الرسوم التوضيحية العلمية. يمكنك المشاركة في هذا المشروع التفاعلي عن طريق إضافة قنديل البحر الخاص بك إلى ملاحظات الآخرين. تذكر: لا يوجد صح أو خطأ في الملاحظة.',
    'האקווריום הישראלי חוקר את תהליך הרבייה של מדוזות. אניה, סטודנטית לתקשורת חזותית בבצלאל, יצרה את \'פרויקט רבייה\' כחלק מקורס איור מדעי. תוכלו לקחת חלק בפרויקט ולהוסיף מדוזה משלכם לתצפיות של אחרים. זכרו: אין נכון או לא נכון בתצפית. לכל אחד מאיתנו חוויה ייחודית, ויחד ניצור משהו יפה.',
    C_GRAY, C_GRAY, C_WHITE
  );

  // ── Plus / start button ───────────────────────────────────
  drawPlusIcon(W / 2, 880);
}

// ============================================================
// SCREEN 2 — DRAWING
// ============================================================
function drawDrawingScreen() {
  drawBoundingBox();
  drawStrokes();
  drawDrawingInstructions();
  drawButtons();
}

function drawBoundingBox() {
  let { bx, by, bw, bh } = boxBounds();
  ctx.save();
  ctx.strokeStyle = C_DIM;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 4);
  ctx.stroke();
  ctx.restore();
}

function drawStrokes() {
  ctx.save();
  ctx.strokeStyle = 'rgb(211,211,211)';
  ctx.lineWidth   = 3;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  for (let path of drawings[currentPhase - 1]) {
    if (path.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDrawingInstructions() {
  let { by, bh } = boxBounds();
  let boxBottom   = by + bh;
  let dotY        = boxBottom + 30;

  // Phase progress dots
  ctx.save();
  for (let i = 1; i <= 3; i++) {
    let dx = W / 2 + (i - 2) * 20;
    if (i === currentPhase) {
      ctx.fillStyle = C_WHITE;
      ctx.beginPath();
      ctx.arc(dx, dotY, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = C_GRAY;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(dx, dotY, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Three-column instructions
  let textTop = dotY + 22;
  let p       = PHASE_TEXT[currentPhase - 1];
  drawTrilingualColumns(textTop, F_REG, 18,
    p.en, p.ar, p.he, C_GRAY, C_GRAY, C_WHITE);
}

function drawButtons() {
  let btnW = 160, btnH = 44;
  let btnY = H - 110;
  drawRoundedButton(W / 2 - btnW - 20, btnY, btnW, btnH, 'אתחול', 'RESTART');
  drawRoundedButton(W / 2 + 20,        btnY, btnW, btnH, 'שליחה',  'SEND');
}

function drawRoundedButton(x, y, w, h, labelHe, labelEn) {
  let hovered = isPointerInRect(x, y, w, h);
  let color   = hovered ? C_WHITE : C_GRAY;

  // Outline
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 22);
  ctx.stroke();
  ctx.restore();

  // Label — measure Hebrew and English separately, center combined
  let fStr  = F_REG(14);
  let cx    = x + w / 2;
  let cy    = y + h / 2;

  ctx.save();
  ctx.font = fStr;

  // Measure parts
  ctx.direction = 'rtl';
  let heW    = ctx.measureText(labelHe).width;
  ctx.direction = 'ltr';
  let slashW = ctx.measureText(' / ').width;
  let enW    = ctx.measureText(labelEn).width;

  let totalW = heW + slashW + enW;
  let startX = cx - totalW / 2;

  ctx.fillStyle    = color;
  ctx.textBaseline = 'middle';

  // Hebrew — RTL, draw from right edge of Hebrew section
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillText(labelHe, startX + heW, cy);

  // Slash + English — LTR
  ctx.direction = 'ltr';
  ctx.textAlign = 'left';
  ctx.fillText(' / ' + labelEn, startX + heW, cy);

  ctx.restore();
}

// ============================================================
// SCREEN 3 — LOADING
// ============================================================
function drawLoading() {
  // Floating jellyfish image
  let yFloat = Math.sin(frameCount * 0.05) * 18;
  let imgSize = 340;
  if (jellyImg.complete) {
    ctx.drawImage(jellyImg,
      W / 2 - imgSize / 2,
      H * 0.36 - imgSize / 2 + yFloat,
      imgSize, imgSize);
  }

  let baseY = H * 0.63;

  // Hebrew — Lilac, Bold 30px
  drawText('המדוזה שלך עוברת תהליך רבייה ובקרוב תצטרף לאחרות',
    W / 2 - 500, baseY, 1000, F_BOLD(30), C_LILAC, 'center', 'rtl');

  // Arabic — White, Bold 30px
  drawText('قنديل البحر الخاص بك يمر بمرحلة التكاثر وسينضم إلى الآخرين قريباً',
    W / 2 - 500, baseY + 58, 1000, F_BOLD(30), C_WHITE, 'center', 'rtl');

  // English — Gray, Bold 30px
  drawText('Your jellyfish is going through a reproduction phase. It will join the others soon.',
    W / 2 - 500, baseY + 116, 1000, F_BOLD(30), C_GRAY, 'center', 'ltr');

  loadingCounter++;
  if (loadingCounter >= LOADING_FRAMES) {
    addToDatabase();
    state         = 'GALLERY';
    loadingCounter = 0;
  }
}

// ============================================================
// SCREEN 4 — GALLERY
// Each jellyfish:
//   • Floats continuously with its own randomised sine wave
//   • Cycles through the 3 drawn phases every 0.75s (45 frames)
//     asynchronously — each jelly has a random phaseOffset
// ============================================================
function drawGallery() {
  let { bw, bh } = boxBounds();
  let drawCX = W / 2; // center of original bounding box
  let drawCY = H * 0.05 + bh / 2;

  for (let jelly of database) {
    // Continuous floating
    let yFloat = Math.sin(frameCount * jelly.speed + jelly.seed) * jelly.amplitude;

    // Asynchronous phase cycling
    let cycle = (frameCount + jelly.phaseOffset) % (PHASE_FRAMES * 3);
    let phaseIdx = Math.floor(cycle / PHASE_FRAMES); // 0, 1, or 2

    let paths = jelly.frames[phaseIdx];
    if (!paths || paths.length === 0) continue;

    ctx.save();
    ctx.translate(jelly.x, jelly.y + yFloat);
    ctx.scale(0.28, 0.28);
    ctx.strokeStyle = 'rgb(211,211,211)';
    ctx.lineWidth   = 10; // thicker to stay visible at 0.28 scale
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    for (let path of paths) {
      if (path.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(path[0].x - drawCX, path[0].y - drawCY);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x - drawCX, path[i].y - drawCY);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Navigation icons
  drawHomeIcon(ICON_D, H - ICON_D);
  drawPlusIcon(W - ICON_D, H - ICON_D);
}

// ============================================================
// ICONS
// ============================================================

// Plus icon — circle with crosshair
function drawPlusIcon(x, y) {
  let hovered = isPointerNear(x, y, HIT_R);
  let color   = hovered ? C_WHITE : C_GRAY;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;

  // Circle
  ctx.beginPath();
  ctx.arc(x, y, ICON_D / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshair
  ctx.beginPath();
  ctx.moveTo(x - 16, y); ctx.lineTo(x + 16, y);
  ctx.moveTo(x, y - 16); ctx.lineTo(x, y + 16);
  ctx.stroke();
  ctx.restore();
}

// Home icon — V-shape roof + open square body, no door
function drawHomeIcon(x, y) {
  let hovered = isPointerNear(x, y, HIT_R);
  let color   = hovered ? C_WHITE : C_GRAY;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  let half    = ICON_D * 0.36;
  let bodyH   = ICON_D * 0.38;
  let roofH   = ICON_D * 0.28;
  let ovr     = ICON_D * 0.06;
  let bodyTop = y - bodyH / 2 + roofH * 0.3;
  let bodyBot = bodyTop + bodyH;
  let peakY   = bodyTop - roofH;
  let bodyL   = x - half;
  let bodyR   = x + half;

  // V roof — two diagonal lines meeting at peak
  ctx.beginPath();
  ctx.moveTo(bodyL - ovr, bodyTop);
  ctx.lineTo(x, peakY);
  ctx.lineTo(bodyR + ovr, bodyTop);
  ctx.stroke();

  // Body — left wall, floor, right wall (no top line)
  ctx.beginPath();
  ctx.moveTo(bodyL, bodyTop);
  ctx.lineTo(bodyL, bodyBot);
  ctx.lineTo(bodyR, bodyBot);
  ctx.lineTo(bodyR, bodyTop);
  ctx.stroke();

  ctx.restore();
}

// ============================================================
// HIT TESTING HELPERS
// All coordinates are in internal design space (W×H)
// ============================================================
let pointerX = -999;
let pointerY = -999;

function isPointerNear(x, y, r) {
  let dx = pointerX - x;
  let dy = pointerY - y;
  return Math.sqrt(dx * dx + dy * dy) < r;
}

function isPointerInRect(x, y, w, h) {
  return pointerX > x && pointerX < x + w &&
         pointerY > y && pointerY < y + h;
}

function isInsideBox(x, y) {
  let { bx, by, bw, bh } = boxBounds();
  return x > bx && x < bx + bw && y > by && y < by + bh;
}

// ============================================================
// INPUT — Mouse + Touch
// All events convert to internal design coordinates
// ============================================================

function getPos(e) {
  let clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return toDesign(clientX, clientY);
}

// Pointer move — update hover position
function onMove(e) {
  e.preventDefault();
  let p    = getPos(e);
  pointerX = p.x;
  pointerY = p.y;

  // Continue drawing stroke if in drawing state
  if (isPointerDown && state === 'DRAWING') {
    if (isInsideBox(p.x, p.y)) {
      let cur = drawings[currentPhase - 1];
      if (cur.length > 0) cur[cur.length - 1].push({ x: p.x, y: p.y });
    }
  }
}

// Pointer down — start stroke or handle button tap
function onDown(e) {
  e.preventDefault();
  isPointerDown = true;
  let p = getPos(e);
  pointerX = p.x;
  pointerY = p.y;

  if (state === 'WELCOME') {
    if (isPointerNear(W / 2, 880, HIT_R)) {
      state = 'DRAWING';
    }
  }

  else if (state === 'DRAWING') {
    // Start new stroke inside box
    if (isInsideBox(p.x, p.y)) {
      drawings[currentPhase - 1].push([{ x: p.x, y: p.y }]);
    }

    // RESTART button
    let btnW = 160, btnH = 44, btnY = H - 110;
    let rx = W / 2 - btnW - 20;
    if (isPointerInRect(rx, btnY, btnW, btnH)) {
      drawings[currentPhase - 1] = [];
    }

    // SEND button
    let sx = W / 2 + 20;
    if (isPointerInRect(sx, btnY, btnW, btnH)) {
      if (currentPhase < 3) {
        currentPhase++;
      } else {
        state = 'LOADING';
      }
    }
  }

  else if (state === 'GALLERY') {
    // Home icon — go to Welcome
    if (isPointerNear(ICON_D, H - ICON_D, HIT_R)) {
      resetDrawing();
      state = 'WELCOME';
    }
    // Plus icon — start new drawing
    if (isPointerNear(W - ICON_D, H - ICON_D, HIT_R)) {
      resetDrawing();
      state = 'DRAWING';
    }
  }
}

function onUp(e) {
  isPointerDown = false;
}

// Attach events to canvas
canvas.addEventListener('mousemove',  onMove, { passive: false });
canvas.addEventListener('mousedown',  onDown, { passive: false });
canvas.addEventListener('mouseup',    onUp,   { passive: false });
canvas.addEventListener('touchmove',  onMove, { passive: false });
canvas.addEventListener('touchstart', onDown, { passive: false });
canvas.addEventListener('touchend',   onUp,   { passive: false });

// ============================================================
// DATA HELPERS
// ============================================================

function addToDatabase() {
  let cellW = W / GRID_COLS;
  let cellH = H / GRID_ROWS;
  let idx   = database.length % (GRID_COLS * GRID_ROWS);
  let col   = idx % GRID_COLS;
  let row   = Math.floor(idx / GRID_COLS);

  // Hex grid: odd rows offset by half a cell width
  let hexShift = (row % 2 === 1) ? cellW * HEX_OFFSET : 0;
  let cx = (col * cellW + cellW / 2 + hexShift) % W;
  let cy = row * cellH + cellH / 2;

  database.push({
    frames:      JSON.parse(JSON.stringify(drawings)),
    x:           cx + (Math.random() - 0.5) * cellW * 0.44,
    y:           cy + (Math.random() - 0.5) * cellH * 0.44,
    seed:        Math.random() * Math.PI * 2,
    speed:       0.018 + Math.random() * 0.02,
    amplitude:   12 + Math.random() * 16,
    phaseOffset: Math.floor(Math.random() * PHASE_FRAMES * 3)
  });
}

function resetDrawing() {
  currentPhase = 1;
  drawings     = [[], [], []];
}
