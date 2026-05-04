// ============================================================
// Jellyfish Observation Station
// Israel Aquarium × Bezalel Academy
// sketch.js — pure vanilla JS, static hardcoded layout
// ============================================================

const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

const W = 1920;
const H = 1080;

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

const C_LILAC = 'rgb(156,161,209)';
const C_WHITE = 'rgb(255,255,255)';
const C_GRAY  = 'rgb(160,160,160)';
const C_DIM   = 'rgb(90,90,90)';
const C_BLACK = 'rgb(0,0,0)';

const F_REG  = (sz) => `400 ${sz}px Abraham`;
const F_BOLD = (sz) => `700 ${sz}px Abraham`;

const ICON_D = 85;
const HIT_R  = 60;

const GRID_COLS  = 5;
const GRID_ROWS  = 4;
const HEX_OFFSET = 0.5;

const PHASE_FRAMES   = 45;
const LOADING_FRAMES = 360;

const LOGO_H   = 40;
const LOGO_X   = 50;
const LOGO_Y   = 30;
const LOGO_GAP = 30;

let state          = 'WELCOME';
let currentPhase   = 1;
let drawings       = [[], [], []];
let database       = [];
let isPointerDown  = false;
let frameCount     = 0;
let loadingCounter = 0;
let pointerX       = -999;
let pointerY       = -999;

const jellyImg    = new Image();
jellyImg.src      = 'Jellyfish_Assets-01.png';

const bezalelImg  = new Image();
bezalelImg.src    = 'bezalel white.png';
const aquariumImg = new Image();
aquariumImg.src   = 'Israel Aquarium Logo.png';

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

document.fonts.ready.then(() => requestAnimationFrame(loop));

// ============================================================
// LOGOS
// ============================================================
function drawLogos() {
  if (bezalelImg.complete && bezalelImg.naturalWidth > 0) {
    let bezW = (bezalelImg.naturalWidth / bezalelImg.naturalHeight) * LOGO_H;
    ctx.drawImage(bezalelImg, LOGO_X, LOGO_Y, bezW, LOGO_H);

    if (aquariumImg.complete && aquariumImg.naturalWidth > 0) {
      let aqW = (aquariumImg.naturalWidth / aquariumImg.naturalHeight) * LOGO_H;
      ctx.drawImage(aquariumImg, LOGO_X + bezW + LOGO_GAP, LOGO_Y, aqW, LOGO_H);
    }
  }
}

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

  drawLogos();
  requestAnimationFrame(loop);
}

// ============================================================
// SCREEN 1 — WELCOME
// ============================================================
function drawWelcome() {
  const LH = 32;
  const PY = 500;

  ctx.save();
  ctx.textBaseline = 'top';

  ctx.font = F_BOLD(60); ctx.fillStyle = C_LILAC;
  ctx.direction = 'rtl'; ctx.textAlign = 'center';
  ctx.fillText('תחנת תצפית מדוזות', 960, 150);

  ctx.font = F_BOLD(60); ctx.fillStyle = C_WHITE;
  ctx.direction = 'rtl'; ctx.textAlign = 'center';
  ctx.fillText('محطة مراقبة قنديل البحر', 960, 235);

  ctx.font = F_BOLD(60); ctx.fillStyle = C_GRAY;
  ctx.direction = 'ltr'; ctx.textAlign = 'center';
  ctx.fillText('Jellyfish Observation Station', 960, 320);

  ctx.font = F_REG(20); ctx.fillStyle = C_GRAY;
  ctx.direction = 'ltr'; ctx.textAlign = 'left';
  ctx.fillText('The Israel Aquarium researches jellyfish reproduction.',   60, PY + LH * 0);
  ctx.fillText("Anya, a Visual Communications student at Bezalel,",       60, PY + LH * 1);
  ctx.fillText("created her own 'Reproduction Project' for a scientific",  60, PY + LH * 2);
  ctx.fillText('illustration course. You can participate by adding your',  60, PY + LH * 3);
  ctx.fillText('jellyfish. There is no right or wrong: every observation', 60, PY + LH * 4);
  ctx.fillText('is unique, and together we create something beautiful.',   60, PY + LH * 5);

  ctx.font = F_REG(20); ctx.fillStyle = C_GRAY;
  ctx.direction = 'rtl'; ctx.textAlign = 'right';
  ctx.fillText('يقوم الأكواريوم الإسرائيلي بالبحث في عملية تكاثر قناديل البحر.',        1250, PY + LH * 0);
  ctx.fillText('أنيا، طالبة الاتصالات المرئية في بتسلئيل، أنشأت مشروع تكاثر',          1250, PY + LH * 1);
  ctx.fillText('خاصاً بها كجزء من مساق الرسوم التوضيحية العلمية. أنتم مدعوون',          1250, PY + LH * 2);
  ctx.fillText('للمشاركة في المشروع وإضافة قنديل البحر الخاص بكم. تذكروا',              1250, PY + LH * 3);
  ctx.fillText('أنه لا يوجد صح أو خطأ في الملاحظة: كل ملاحظة فريدة،',                  1250, PY + LH * 4);
  ctx.fillText('ومعاً نبتكر شيئاً جميلاً.',                                              1250, PY + LH * 5);

  ctx.font = F_REG(20); ctx.fillStyle = C_WHITE;
  ctx.direction = 'rtl'; ctx.textAlign = 'right';
  ctx.fillText('האקווריום הישראלי חוקר את תהליך הרבייה של מדוזות.',                     1860, PY + LH * 0);
  ctx.fillText('אניה, סטודנטית לתקשורת חזותית בבצלאל, יצרה פרויקט',                    1860, PY + LH * 1);
  ctx.fillText('רבייה משלה כחלק מקורס איור מדעי. אתם מוזמנים להשתתף',                  1860, PY + LH * 2);
  ctx.fillText('בפרויקט ולהוסיף מדוזה משלכם. זכרו שאין נכון או לא נכון',               1860, PY + LH * 3);
  ctx.fillText('בתצפית: כל תצפית היא ייחודית, ואנחנו יוצרים',                           1860, PY + LH * 4);
  ctx.fillText('משהו יפה יחד.',                                                          1860, PY + LH * 5);

  ctx.restore();
  drawPlusIcon(960, 880);
}

// ============================================================
// SCREEN 2 — DRAWING
// ============================================================
const BOX_X = 461;
const BOX_Y = 80;
const BOX_W = 998;
const BOX_H = 540;

// Dots at Y=654, buttons at Y=970
// Text midpoint = (654 + 970) / 2 = 812, text is ~17px tall so Y = 812 - 8 = 804
// But we want equal padding: space above text from dots, space below to buttons
// Dots bottom = 654+4=658, buttons top = 970
// Total space = 970 - 658 = 312px. Text at center = 658 + 156 = 814
const INSTR_Y = 814;

function drawDrawingScreen() {
  // Bounding box
  ctx.save();
  ctx.strokeStyle = C_DIM;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(BOX_X, BOX_Y, BOX_W, BOX_H, 4);
  ctx.stroke();
  ctx.restore();

  // User strokes
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

  // Phase dots at Y=654
  ctx.save();
  for (let i = 1; i <= 3; i++) {
    let dx = 960 + (i - 2) * 20;
    if (i === currentPhase) {
      ctx.fillStyle = C_WHITE;
      ctx.beginPath();
      ctx.arc(dx, 654, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = C_GRAY;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(dx, 654, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Instructions — centered between dots (Y=654) and buttons (Y=970)
  let p = PHASE_TEXT[currentPhase - 1];
  ctx.save();
  ctx.font = F_REG(17);
  ctx.textBaseline = 'middle';

  ctx.fillStyle = C_GRAY;
  ctx.direction = 'ltr'; ctx.textAlign = 'left';
  ctx.fillText(p.en, 60, INSTR_Y);

  ctx.fillStyle = C_GRAY;
  ctx.direction = 'rtl'; ctx.textAlign = 'right';
  ctx.fillText(p.ar, 1250, INSTR_Y);

  ctx.fillStyle = C_WHITE;
  ctx.direction = 'rtl'; ctx.textAlign = 'right';
  ctx.fillText(p.he, 1860, INSTR_Y);

  ctx.restore();

  // Buttons — restart wider to fit Hebrew text
  drawRoundedButton(960 - 220 - 20, 948, 220, 44, 'להתחיל מחדש', 'Restart');
  drawRoundedButton(960 + 20,       948, 160, 44, 'שליחה',        'Send');
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

  ctx.save();
  ctx.font = F_REG(14);
  ctx.direction = 'rtl';
  let heW    = ctx.measureText(labelHe).width / DPR;
  ctx.direction = 'ltr';
  let slashW = ctx.measureText(' / ').width / DPR;
  let enW    = ctx.measureText(labelEn).width / DPR;
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
    ctx.drawImage(jellyImg,
      960 - imgSize / 2,
      389 - imgSize / 2 + yFloat,
      imgSize, imgSize);
  }

  ctx.save();
  ctx.textBaseline = 'top';

  ctx.font = F_BOLD(30); ctx.fillStyle = C_LILAC;
  ctx.direction = 'rtl'; ctx.textAlign = 'center';
  ctx.fillText('המדוזה שלך עוברת תהליך רבייה ובקרוב תצטרף לאחרות', 960, 680);

  ctx.font = F_BOLD(30); ctx.fillStyle = C_WHITE;
  ctx.direction = 'rtl'; ctx.textAlign = 'center';
  ctx.fillText('قنديل البحر الخاص بك يمر بمرحلة التكاثر وسينضم إلى الآخرين قريباً', 960, 740);

  ctx.font = F_BOLD(30); ctx.fillStyle = C_GRAY;
  ctx.direction = 'ltr'; ctx.textAlign = 'center';
  ctx.fillText('Your jellyfish is going through a reproduction phase. It will join the others soon.', 960, 800);

  ctx.restore();

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
    // Restart button — wider now at x=960-220-20, w=220
    if (isPointerInRect(960 - 220 - 20, 948, 220, 44)) {
      drawings[currentPhase - 1] = [];
    }
    if (isPointerInRect(960 + 20, 948, 160, 44)) {
      if (currentPhase < 3) currentPhase++;
      else state = 'LOADING';
    }
  }
  else if (state === 'GALLERY') {
    if (isPointerNear(ICON_D, H - ICON_D, HIT_R))     { resetDrawing(); state = 'WELCOME'; }
    if (isPointerNear(W - ICON_D, H - ICON_D, HIT_R)) { resetDrawing(); state = 'DRAWING'; }
  }
}

function onUp(e) { isPointerDown = false; }

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
