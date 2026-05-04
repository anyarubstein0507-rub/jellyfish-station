// ============================================================
// Jellyfish Observation Station
// Israel Aquarium × Bezalel Academy
// sketch.js — pure vanilla JS, static hardcoded layout
// ============================================================

// ── Canvas ───────────────────────────────────────────────────
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

// Internal resolution — all coordinates are in 1920×1080 space
const W = 1920;
const H = 1080;

// Retina/HiDPI: multiply by devicePixelRatio for sharp rendering
const DPR = window.devicePixelRatio || 1;
canvas.width  = W * DPR;
canvas.height = H * DPR;
ctx.scale(DPR, DPR);

function resize() {
  let s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width  = (W * s) + 'px';
  canvas.style.height = (H * s) + 'px';
}
window.addEventListener('resize', resize);
resize();

function toDesign(screenX, screenY) {
  let rect = canvas.getBoundingClientRect();
  return {
    x: (screenX - rect.left) * (W / rect.width),
    y: (screenY - rect.top)  * (H / rect.height)
  };
}

// ── Colors ───────────────────────────────────────────────────
const C_LILAC = 'rgb(156,161,209)';
const C_WHITE = 'rgb(255,255,255)';
const C_GRAY  = 'rgb(160,160,160)';
const C_DIM   = 'rgb(90,90,90)';
const C_BLACK = 'rgb(0,0,0)';

// ── Fonts ────────────────────────────────────────────────────
const F_REG  = (sz) => `400 ${sz}px Abraham`;
const F_BOLD = (sz) => `700 ${sz}px Abraham`;

// ── Icons ────────────────────────────────────────────────────
const ICON_D = 85;
const HIT_R  = 60;

// ── Gallery grid ─────────────────────────────────────────────
const GRID_COLS  = 5;
const GRID_ROWS  = 4;
const HEX_OFFSET = 0.5;

// ── Gallery animation: 0.75s per phase at 60fps ──────────────
const PHASE_FRAMES = 45;

// ── Loading duration: 4 seconds ──────────────────────────────
const LOADING_FRAMES = 240;

// ── State ────────────────────────────────────────────────────
let state         = 'WELCOME';
let currentPhase  = 1;
let drawings      = [[], [], []];
let database      = [];
let isPointerDown = false;
let frameCount    = 0;
let loadingCounter = 0;

// ── Pointer position in design space ─────────────────────────
let pointerX = -999;
let pointerY = -999;

// ── Jellyfish image ──────────────────────────────────────────
const jellyImg = new Image();
jellyImg.src   = 'Jellyfish_Assets-01.png';

// ── Instruction copy ─────────────────────────────────────────
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

// ── Start after fonts load ───────────────────────────────────
document.fonts.ready.then(() => requestAnimationFrame(loop));

// ============================================================
// MAIN LOOP
// ============================================================
function loop() {
  frameCount++;
  ctx.fillStyle = C_BLACK;
  ctx.fillRect(0, 0, W, H);

  if      (state === 'WELCOME') drawWelcome();
  else if (state === 'DRAWING') drawDrawingScreen();
  else if (state === 'LOADING') drawLoading();
  else if (state === 'GALLERY') drawGallery();

  requestAnimationFrame(loop);
}

// ============================================================
// CORE TEXT FUNCTION
// ============================================================
function drawText(str, x, y, maxW, fontStr, color, align, dir) {
  ctx.save();
  ctx.font         = fontStr;
  ctx.fillStyle    = color;
  ctx.direction    = dir   || 'ltr';
  ctx.textAlign    = align || 'left';
  ctx.textBaseline = 'top';

  if (!maxW) {
    ctx.fillText(str, x, y);
  } else {
    let sz     = parseFloat(fontStr);
    let lineH  = sz * 1.65;
    let curY   = y;

    let anchorX = x;
    if (align === 'center') anchorX = x + maxW / 2;
    if (align === 'right')  anchorX = x + maxW;

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
  }
  ctx.restore();
}

// ============================================================
// SCREEN 1 — WELCOME
// ============================================================
function drawWelcome() {
  // Titles
  drawText('תחנת תצפית מדוזות',
    460, 150, 1000, F_BOLD(60), C_LILAC, 'center', 'rtl');
  drawText('محطة مراقبة قنديل البحر',
    460, 235, 1000, F_BOLD(60), C_WHITE, 'center', 'rtl');
  drawText('Jellyfish Observation Station',
    460, 320, 1000, F_BOLD(60), C_GRAY, 'center', 'ltr');

  // Paragraphs — three columns, Y=430
  // English — left, center=330
  drawText(
    'The Israel Aquarium researches jellyfish reproduction. Anya, a Visual Communications student at Bezalel, created her own \'Reproduction Project\' for a scientific illustration course. You can participate by adding your jellyfish. There is no right or wrong: every observation is unique, and together we create something beautiful.',
    50, 430, 580, F_REG(20), C_GRAY, 'center', 'ltr');

  // Arabic — middle, center=960
  drawText(
    'يقوم الأكواريوم الإسرائيلي بالبحث في عملية تكاثر قناديل البحر. أنيا، طالبة الاتصالات المرئية في بتسلئيل، أنشأت \'مشروع التكاثر\' كجزء من مساق الرسوم التوضيحية العلمية. يمكنك المشاركة في هذا المشروع التفاعلي عن طريق إضافة قنديل البحر الخاص بك إلى ملاحظات الآخرين. تذكر: لا يوجد صح أو خطأ في الملاحظة.',
    670, 430, 580, F_REG(20), C_GRAY, 'center', 'rtl');

  // Hebrew — right, center=1590
  drawText(
    'האקווריום הישראלי חוקר את תהליך הרבייה של מדוזות. אניה, סטודנטית לתקשורת חזותית בבצלאל, יצרה את \'פרויקט רבייה\' כחלק מקורס איור מדעי. תוכלו לקחת חלק בפרויקט ולהוסיף מדוזה משלכם לתצפיות של אחרים. זכרו: אין נכון או לא נכון בתצפית. לכל אחד מאיתנו חוויה ייחודית, ויחד ניצור משהו יפה.',
    1290, 430, 580, F_REG(20), C_WHITE, 'center', 'rtl');

  // Plus button
  drawPlusIcon(960, 880);
}

// ============================================================
// SCREEN 2 — DRAWING
// ============================================================
const BOX_X = 461;
const BOX_Y = 54;
const BOX_W = 998;
const BOX_H = 540;

function drawDrawingScreen() {
  // Bounding box
  ctx.save();
  ctx.strokeStyle = C_DIM;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(BOX_X, BOX_Y, BOX_W, BOX_H, 4);
  ctx.stroke();
  ctx.restore();

  // Strokes
  ctx.save();
  ctx.strokeStyle = C_WHITE;
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

  // Phase dots at Y=624
  ctx.save();
  for (let i = 1; i <= 3; i++) {
    let dx = 960 + (i - 2) * 20;
    if (i === currentPhase) {
      ctx.fillStyle = C_WHITE;
      ctx.beginPath();
      ctx.arc(dx, 624, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = C_GRAY;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(dx, 624, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Instructions at Y=650
  let p = PHASE_TEXT[currentPhase - 1];
  drawText(p.en,  50, 650, 560, F_REG(18), C_GRAY,  'center', 'ltr');
  drawText(p.ar, 680, 650, 560, F_REG(18), C_GRAY,  'center', 'rtl');
  drawText(p.he, 1310, 650, 560, F_REG(18), C_WHITE, 'center', 'rtl');

  // Buttons at Y=970
  drawRoundedButton(960 - 160 - 20, 970, 160, 44, 'אתחול', 'RESTART');
  drawRoundedButton(960 + 20,       970, 160, 44, 'שליחה',  'SEND');
}

function drawRoundedButton(x, y, w, h, labelHe, labelEn) {
  let hovered = isPointerInRect(x, y, w, h);
  let color   = hovered ? C_WHITE : C_GRAY;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 22);
  ctx.stroke();
  ctx.restore();

  let fStr = F_REG(14);
  ctx.save();
  ctx.font = fStr;
  ctx.direction = 'rtl';
  let heW    = ctx.measureText(labelHe).width;
  ctx.direction = 'ltr';
  let slashW = ctx.measureText(' / ').width;
  let enW    = ctx.measureText(labelEn).width;
  let totalW = heW + slashW + enW;
  let startX = (x + w / 2) - totalW / 2;
  let midY   = y + h / 2;

  ctx.fillStyle    = color;
  ctx.textBaseline = 'middle';
  ctx.direction    = 'rtl';
  ctx.textAlign    = 'right';
  ctx.fillText(labelHe, startX + heW, midY);
  ctx.direction = 'ltr';
  ctx.textAlign = 'left';
  ctx.fillText(' / ' + labelEn, startX + heW, midY);
  ctx.restore();
}

// ============================================================
// SCREEN 3 — LOADING
// ============================================================
function drawLoading() {
  let yFloat  = Math.sin(frameCount * 0.05) * 18;
  let imgSize = 340;
  if (jellyImg.complete && jellyImg.naturalWidth > 0) {
    ctx.drawImage(jellyImg, 960 - imgSize / 2, 389 - imgSize / 2 + yFloat, imgSize, imgSize);
  }

  drawText('המדוזה שלך עוברת תהליך רבייה ובקרוב תצטרף לאחרות',
    460, 680, 1000, F_BOLD(30), C_LILAC, 'center', 'rtl');
  drawText('قنديل البحر الخاص بك يمر بمرحلة التكاثر وسينضم إلى الآخرين قريباً',
    460, 740, 1000, F_BOLD(30), C_WHITE, 'center', 'rtl');
  drawText('Your jellyfish is going through a reproduction phase. It will join the others soon.',
    460, 800, 1000, F_BOLD(30), C_GRAY, 'center', 'ltr');

  loadingCounter++;
  if (loadingCounter >= LOADING_FRAMES) {
    addToDatabase();
    state          = 'GALLERY';
    loadingCounter = 0;
  }
}

// ============================================================
// SCREEN 4 — GALLERY
// ============================================================
function drawGallery() {
  let drawCX = BOX_X + BOX_W / 2;
  let drawCY = BOX_Y + BOX_H / 2;

  for (let jelly of database) {
    let yFloat   = Math.sin(frameCount * jelly.speed + jelly.seed) * jelly.amplitude;
    let cycle    = (frameCount + jelly.phaseOffset) % (PHASE_FRAMES * 3);
    let phaseIdx = Math.floor(cycle / PHASE_FRAMES);
    let paths    = jelly.frames[phaseIdx];
    if (!paths || paths.length === 0) continue;

    ctx.save();
    ctx.translate(jelly.x, jelly.y + yFloat);
    ctx.scale(0.28, 0.28);
    ctx.strokeStyle = C_WHITE;
    ctx.lineWidth   = 10;
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

  drawHomeIcon(ICON_D, H - ICON_D);
  drawPlusIcon(W - ICON_D, H - ICON_D);
}

// ============================================================
// ICONS
// ============================================================
function drawPlusIcon(x, y) {
  let hovered = isPointerNear(x, y, HIT_R);
  let color   = hovered ? C_WHITE : C_GRAY;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, ICON_D / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 16, y); ctx.lineTo(x + 16, y);
  ctx.moveTo(x, y - 16); ctx.lineTo(x, y + 16);
  ctx.stroke();
  ctx.restore();
}

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

  ctx.beginPath();
  ctx.moveTo(bodyL - ovr, bodyTop);
  ctx.lineTo(x, peakY);
  ctx.lineTo(bodyR + ovr, bodyTop);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bodyL, bodyTop);
  ctx.lineTo(bodyL, bodyBot);
  ctx.lineTo(bodyR, bodyBot);
  ctx.lineTo(bodyR, bodyTop);
  ctx.stroke();

  ctx.restore();
}

// ============================================================
// HIT TESTING
// ============================================================
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
  return x > BOX_X && x < BOX_X + BOX_W &&
         y > BOX_Y && y < BOX_Y + BOX_H;
}

// ============================================================
// INPUT — Mouse + Touch
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

function onMove(e) {
  e.preventDefault();
  let p    = getPos(e);
  pointerX = p.x;
  pointerY = p.y;
  if (isPointerDown && state === 'DRAWING' && isInsideBox(p.x, p.y)) {
    let cur = drawings[currentPhase - 1];
    if (cur.length > 0) cur[cur.length - 1].push({ x: p.x, y: p.y });
  }
}

function onDown(e) {
  e.preventDefault();
  isPointerDown = true;
  let p    = getPos(e);
  pointerX = p.x;
  pointerY = p.y;

  if (state === 'WELCOME') {
    if (isPointerNear(960, 880, HIT_R)) state = 'DRAWING';
  }
  else if (state === 'DRAWING') {
    if (isInsideBox(p.x, p.y)) {
      drawings[currentPhase - 1].push([{ x: p.x, y: p.y }]);
    }
    if (isPointerInRect(960 - 160 - 20, 970, 160, 44)) {
      drawings[currentPhase - 1] = [];
    }
    if (isPointerInRect(960 + 20, 970, 160, 44)) {
      if (currentPhase < 3) currentPhase++;
      else state = 'LOADING';
    }
  }
  else if (state === 'GALLERY') {
    if (isPointerNear(ICON_D, H - ICON_D, HIT_R))     { resetDrawing(); state = 'WELCOME'; }
    if (isPointerNear(W - ICON_D, H - ICON_D, HIT_R)) { resetDrawing(); state = 'DRAWING'; }
  }
}

function onUp(e) {
  isPointerDown = false;
}

canvas.addEventListener('mousemove',  onMove, { passive: false });
canvas.addEventListener('mousedown',  onDown, { passive: false });
canvas.addEventListener('mouseup',    onUp,   { passive: false });
canvas.addEventListener('touchmove',  onMove, { passive: false });
canvas.addEventListener('touchstart', onDown, { passive: false });
canvas.addEventListener('touchend',   onUp,   { passive: false });

// ============================================================
// DATA
// ============================================================
function addToDatabase() {
  let cellW = W / GRID_COLS;
  let cellH = H / GRID_ROWS;
  let idx   = database.length % (GRID_COLS * GRID_ROWS);
  let col   = idx % GRID_COLS;
  let row   = Math.floor(idx / GRID_COLS);

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
