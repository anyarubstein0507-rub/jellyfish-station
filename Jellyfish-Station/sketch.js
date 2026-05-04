// ============================================================
// Jellyfish Observation Station — Israel Aquarium
// sketch.js v6
// ============================================================

let state = "WELCOME";
let currentPhase = 1;
let drawings     = [[], [], []];
let database     = [];
let penSize      = 3;
let loadingCounter = 0;
let fontBold, fontRegular, loadingImage;
let ctx; // raw 2D canvas context — used for all text (LTR + RTL)

// ── Color palette ────────────────────────────────────────────
const LILAC    = [156, 161, 209];
const INK_WHITE = 255;
const INK_GRAY  = 160;

// ── CSS color strings (used by ctx) ─────────────────────────
const CSS_LILAC = `rgb(156,161,209)`;
const CSS_WHITE = `rgb(255,255,255)`;
const CSS_GRAY  = `rgb(160,160,160)`;

// ── Font strings — reference the @font-face family name ─────
// ctx.font format: "weight size family"
const F_REG  = (sz) => `400 ${sz}px Abraham`;
const F_BOLD = (sz) => `700 ${sz}px Abraham`;

// ── Icon diameter ────────────────────────────────────────────
const ICON_D = 85;

// ── Hex gallery grid ─────────────────────────────────────────
const GRID_COLS  = 5;
const GRID_ROWS  = 4;
const HEX_OFFSET = 0.5;

// ── Gallery phase cycling — 0.75 sec per phase at 60fps ──────
const PHASE_FRAMES = 45; // 0.75s × 60fps

// ── Column layout — three side-by-side text columns ──────────
const COL_W    = 500;
const COL_EN_C = 330;   // center X — English
const COL_AR_C = 960;   // center X — Arabic
const COL_HE_C = 1590;  // center X — Hebrew

// ── Trilingual instruction copy ──────────────────────────────
const PHASES = [
  {
    he: "התבוננו במדוזה. ציירו אותה כשהיא קטנה ועגולה. השתמשו בעיפרון האפור.",
    ar: "راقب قنديل البحر. ارسمه عندما يكون صغيراً ومستديراً. استخدم القلم الرمادي.",
    en: "Watch the jellyfish. Draw it when it is small and round. Use the gray pen."
  },
  {
    he: "כעת ציירו את המדוזה כשהיא מתחילה להתרחב.",
    ar: "الآن ارسم قنديل البحر وهو يبدأ في التوسع.",
    en: "Now draw the jellyfish as it begins to expand."
  },
  {
    he: "לסיים, ציירו את המדוזה כשהיא שטוחה לחלוטין וצפה.",
    ar: "أخيراً، ارسم قنديل البحر وهو مسطح تماماً وعائم.",
    en: "Finally, draw the jellyfish when it is fully flat and floating."
  }
];

// ============================================================
// PRELOAD
// ============================================================
function preload() {
  fontBold     = loadFont('Abraham-Bold.otf');
  fontRegular  = loadFont('Abraham-Regular.otf');
  loadingImage = loadImage('Jellyfish_Assets-01.png');
}

// ============================================================
// SETUP
// ============================================================
function setup() {
  createCanvas(1920, 1080);
  textFont(fontRegular);
  ctx = document.querySelector('canvas').getContext('2d');
}

// ============================================================
// DRAW LOOP
// ============================================================
function draw() {
  background(0);
  if      (state === "WELCOME") drawWelcome();
  else if (state === "DRAWING") { drawBoundingBox(); drawCanvas(); drawDrawingInstructions(); drawUI(); }
  else if (state === "LOADING") drawLoading();
  else if (state === "GALLERY") drawGallery();
}

// ============================================================
// TEXT HELPERS
// All text goes through ctx so fonts are consistent (Abraham)
// and RTL languages render correctly.
// ============================================================

// Draw a single line of text via ctx (no wrapping)
function ctxText(str, x, y, fontStr, colorStr, align, direction) {
  ctx.save();
  ctx.font      = fontStr;
  ctx.fillStyle = colorStr;
  ctx.textAlign = align      || 'center';
  ctx.direction = direction  || 'ltr';
  ctx.fillText(str, x, y);
  ctx.restore();
}

// Draw wrapped text via ctx
// x = left edge of box, y = top edge, maxW = box width
// align: 'left' | 'center' | 'right'
// direction: 'ltr' | 'rtl'
function ctxWrappedText(str, x, y, maxW, fontStr, colorStr, align, direction) {
  ctx.save();
  ctx.font      = fontStr;
  ctx.fillStyle = colorStr;
  ctx.direction = direction || 'ltr';
  ctx.textAlign = align     || 'left';

  let sz    = parseFloat(fontStr);
  let lineH = sz * 1.6;
  let curY  = y + sz; // first baseline

  // Determine draw X from alignment + box
  function drawX() {
    if (align === 'center') return x + maxW / 2;
    if (align === 'right')  return x + maxW;
    return x; // left
  }

  let words = str.split(' ');
  let line  = '';
  for (let w of words) {
    let test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, drawX(), curY);
      line  = w;
      curY += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, drawX(), curY);
  ctx.restore();
}

// ============================================================
// TRILINGUAL COLUMN BLOCK
// Renders all three languages side by side using ctx.
// colTop = top Y of text area
// fontFn = F_REG or F_BOLD
// sz = font size in px
// ============================================================
function drawTrilingualColumns(colTop, fontFn, sz, enStr, arStr, heStr,
                                enColor, arColor, heColor) {
  let f = fontFn(sz);

  // English — left column, LTR, center-aligned within col
  ctxWrappedText(enStr,
    COL_EN_C - COL_W / 2, colTop, COL_W,
    f, enColor || CSS_GRAY, 'center', 'ltr');

  // Arabic — middle column, RTL, center-aligned within col
  ctxWrappedText(arStr,
    COL_AR_C - COL_W / 2, colTop, COL_W,
    f, arColor || CSS_GRAY, 'center', 'rtl');

  // Hebrew — right column, RTL, center-aligned within col
  ctxWrappedText(heStr,
    COL_HE_C - COL_W / 2, colTop, COL_W,
    f, heColor || CSS_WHITE, 'center', 'rtl');
}

// ============================================================
// SCREEN 1 — WELCOME
// ============================================================
function drawWelcome() {
  // ── Titles — all via ctx, centered on canvas ──────────────
  // Hebrew — Lilac, Bold 60px, RTL
  ctxWrappedText("תחנת תצפית מדוזות",
    width / 2 - 500, 100, 1000,
    F_BOLD(60), CSS_LILAC, 'center', 'rtl');

  // Arabic — White, Bold 60px, RTL
  ctxWrappedText("محطة مراقبة قنديل البحر",
    width / 2 - 500, 185, 1000,
    F_BOLD(60), CSS_WHITE, 'center', 'rtl');

  // English — Gray, Bold 60px, LTR
  ctxWrappedText("Jellyfish Observation Station",
    width / 2 - 500, 270, 1000,
    F_BOLD(60), CSS_GRAY, 'center', 'ltr');

  // ── Three-column paragraphs ───────────────────────────────
  drawTrilingualColumns(
    390, F_REG, 20,
    "The Israel Aquarium researches jellyfish reproduction. Anya, a Visual Communications student at Bezalel, created her own 'Reproduction Project' for a scientific illustration course. You can participate by adding your jellyfish. There is no right or wrong: every observation is unique, and together we create something beautiful.",
    "يقوم الأكواريوم الإسرائيلي بالبحث في عملية تكاثر قناديل البحر. أنيا، طالبة الاتصالات المرئية في بتسلئيل، أنشأت 'مشروع التكاثر' كجزء من مساق الرسوم التوضيحية العلمية. يمكنك المشاركة في هذا المشروع التفاعلي عن طريق إضافة قنديل البحر الخاص بك إلى ملاحظات الآخرين. تذكر: لا يوجد صح أو خطأ في الملاحظة.",
    "האקווריום הישראלי חוקר את תהליך הרבייה של מדוזות. אניה, סטודנטית לתקשורת חזותית בבצלאל, יצרה את 'פרויקט רבייה' כחלק מקורס איור מדעי. תוכלו לקחת חלק בפרויקט ולהוסיף מדוזה משלכם לתצפיות של אחרים. זכרו: אין נכון או לא נכון בתצפית. לכל אחד מאיתנו חוויה ייחודית, ויחד ניצור משהו יפה.",
    CSS_GRAY, CSS_GRAY, CSS_WHITE
  );

  // ── Plus / start button ───────────────────────────────────
  drawPlusIcon(width / 2, 880);
}

// ============================================================
// SCREEN 2 — DRAWING
// ============================================================
function boxBounds() {
  let bw = width  * 0.52;
  let bh = height * 0.50;
  let bx = (width  - bw) / 2;
  let by = height * 0.05;
  return { bx, by, bw, bh };
}

function drawBoundingBox() {
  let { bx, by, bw, bh } = boxBounds();
  noFill();
  stroke(90);
  strokeWeight(1.5);
  rect(bx, by, bw, bh, 4);
}

function drawCanvas() {
  stroke(211);
  strokeWeight(penSize);
  noFill();
  for (let path of drawings[currentPhase - 1]) {
    beginShape();
    for (let p of path) vertex(p.x, p.y);
    endShape();
  }
  if (mouseIsPressed && isInsideBox(mouseX, mouseY)) {
    let cur = drawings[currentPhase - 1];
    if (cur.length > 0) cur[cur.length - 1].push({ x: mouseX, y: mouseY });
  }
}

function isInsideBox(mx, my) {
  let { bx, by, bw, bh } = boxBounds();
  return mx > bx && mx < bx + bw && my > by && my < by + bh;
}

function drawDrawingInstructions() {
  let { by, bh } = boxBounds();
  const boxBottom = by + bh;
  const DOT_Y    = boxBottom + 30;

  // Phase dots
  for (let i = 1; i <= 3; i++) {
    let dx = width / 2 + (i - 2) * 20;
    if (i === currentPhase) {
      fill(INK_WHITE); noStroke(); ellipse(dx, DOT_Y, 8, 8);
    } else {
      noFill(); stroke(INK_GRAY); strokeWeight(1); ellipse(dx, DOT_Y, 8, 8);
    }
  }
  noStroke();

  // Three-column instructions below dots
  const TEXT_TOP = DOT_Y + 20;
  const p = PHASES[currentPhase - 1];
  drawTrilingualColumns(TEXT_TOP, F_REG, 18,
    p.en, p.ar, p.he,
    CSS_GRAY, CSS_GRAY, CSS_WHITE);
}

function drawUI() {
  let btnH = 44, btnW = 160;
  let btnY = height - 110;
  drawRoundedButton(width / 2 - btnW - 20, btnY, btnW, btnH, "אתחול", "RESTART");
  drawRoundedButton(width / 2 + 20,        btnY, btnW, btnH, "שליחה",  "SEND");
}

function drawRoundedButton(x, y, w, h, labelHe, labelEn) {
  let hovered = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  let col = hovered ? INK_WHITE : INK_GRAY;
  let cssCol = hovered ? CSS_WHITE : CSS_GRAY;

  // Button outline via p5
  noFill();
  stroke(col);
  strokeWeight(1.5);
  rect(x, y, w, h, 22);

  // Button label via ctx — Hebrew RTL + English LTR in one centered line
  // Draw Hebrew part (RTL) then English part (LTR), both centered together
  let cx   = x + w / 2;
  let cy   = y + h / 2 + 5; // +5 for baseline offset
  let fStr = F_REG(14);

  ctx.save();
  ctx.font      = fStr;
  ctx.fillStyle = cssCol;

  // Measure both parts
  ctx.direction = 'ltr';
  let slashW = ctx.measureText(' / ').width;
  ctx.direction = 'rtl';
  let heW = ctx.measureText(labelHe).width;
  ctx.direction = 'ltr';
  let enW = ctx.measureText(labelEn).width;

  // Total width of "אתחול / RESTART"
  let totalW = heW + slashW + enW;
  let startX = cx - totalW / 2;

  // Draw Hebrew (RTL) — anchor right side of Hebrew part
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillText(labelHe, startX + heW, cy);

  // Draw slash + English (LTR)
  ctx.direction = 'ltr';
  ctx.textAlign = 'left';
  ctx.fillText(' / ' + labelEn, startX + heW, cy);

  ctx.restore();
}

// ============================================================
// SCREEN 3 — LOADING
// ============================================================
function drawLoading() {
  background(0);

  let yFloat = sin(frameCount * 0.05) * 18;
  imageMode(CENTER);
  image(loadingImage, width / 2, height * 0.36 + yFloat, 340, 340);

  let baseY = height * 0.63;

  // Hebrew — Lilac, Bold 30px
  ctxWrappedText(
    "המדוזה שלך עוברת תהליך רבייה ובקרוב תצטרף לאחרות",
    width / 2 - 500, baseY, 1000,
    F_BOLD(30), CSS_LILAC, 'center', 'rtl');

  // Arabic — White, Bold 30px
  ctxWrappedText(
    "قنديل البحر الخاص بك يمر بمرحلة التكاثر وسينضم إلى الآخرين قريباً",
    width / 2 - 500, baseY + 55, 1000,
    F_BOLD(30), CSS_WHITE, 'center', 'rtl');

  // English — Gray, Bold 30px
  ctxWrappedText(
    "Your jellyfish is going through a reproduction phase. It will join the others soon.",
    width / 2 - 500, baseY + 110, 1000,
    F_BOLD(30), CSS_GRAY, 'center', 'ltr');

  loadingCounter++;
  if (loadingCounter > 240) {
    addToDatabase();
    state         = "GALLERY";
    loadingCounter = 0;
  }
}

// ============================================================
// SCREEN 4 — GALLERY
// Each jellyfish:
//   • floats up/down continuously with its own sine wave
//   • cycles through its 3 drawn phases every 0.75s (PHASE_FRAMES)
//     independently (each jelly has its own phaseOffset so they
//     are all asynchronous)
// ============================================================
function drawGallery() {
  for (let jelly of database) {
    // ── Continuous float ─────────────────────────────────────
    let yFloat = sin(frameCount * jelly.speed + jelly.seed) * jelly.amplitude;

    // ── Asynchronous phase cycling ───────────────────────────
    // Each jelly has a phaseOffset (set at creation) so they
    // don't all switch at the same time.
    let cycleFrame = (frameCount + jelly.phaseOffset) % (PHASE_FRAMES * 3);
    let currentDrawingPhase = floor(cycleFrame / PHASE_FRAMES); // 0, 1, or 2

    push();
    translate(jelly.x, jelly.y + yFloat);
    scale(0.28);
    stroke(211);
    strokeWeight(penSize * 3.5);
    noFill();

    // Center the drawing around 0,0
    let { bx, by, bw, bh } = boxBounds();
    let cx = bx + bw / 2;
    let cy = by + bh / 2;

    for (let path of jelly.frames[currentDrawingPhase]) {
      beginShape();
      for (let p of path) vertex(p.x - cx, p.y - cy);
      endShape();
    }
    pop();
  }

  // Nav icons
  drawHomeIcon(ICON_D, height - ICON_D);
  drawPlusIcon(width - ICON_D, height - ICON_D);
}

// ============================================================
// ICONS
// ============================================================
function drawPlusIcon(x, y) {
  let hovered = dist(mouseX, mouseY, x, y) < 60;
  let c = hovered ? INK_WHITE : INK_GRAY;
  noFill(); stroke(c); strokeWeight(1.5);
  ellipse(x, y, ICON_D, ICON_D);
  line(x - 16, y, x + 16, y);
  line(x, y - 16, x, y + 16);
}

function drawHomeIcon(x, y) {
  let hovered = dist(mouseX, mouseY, x, y) < 60;
  let c = hovered ? INK_WHITE : INK_GRAY;
  stroke(c); strokeWeight(1.5); noFill();

  let half    = ICON_D * 0.36;
  let bodyH   = ICON_D * 0.38;
  let roofH   = ICON_D * 0.28;
  let ovr     = ICON_D * 0.06;
  let bodyTop = y - bodyH / 2 + roofH * 0.3;
  let bodyBot = bodyTop + bodyH;
  let peakY   = bodyTop - roofH;
  let bodyL   = x - half;
  let bodyR   = x + half;

  // V roof
  line(bodyL - ovr, bodyTop, x, peakY);
  line(bodyR + ovr, bodyTop, x, peakY);
  // Body — 3 sides, no top
  line(bodyL, bodyTop, bodyL, bodyBot);
  line(bodyR, bodyTop, bodyR, bodyBot);
  line(bodyL, bodyBot, bodyR, bodyBot);
}

// ============================================================
// MOUSE EVENTS
// ============================================================
function mousePressed() {
  if (state === "WELCOME") {
    if (dist(mouseX, mouseY, width / 2, 880) < 60) state = "DRAWING";
  }
  else if (state === "DRAWING") {
    if (isInsideBox(mouseX, mouseY)) drawings[currentPhase - 1].push([]);

    let btnH = 44, btnW = 160, btnY = height - 110;

    // RESTART
    let rx = width / 2 - btnW - 20;
    if (mouseX > rx && mouseX < rx + btnW && mouseY > btnY && mouseY < btnY + btnH)
      drawings[currentPhase - 1] = [];

    // SEND / advance phase
    let sx = width / 2 + 20;
    if (mouseX > sx && mouseX < sx + btnW && mouseY > btnY && mouseY < btnY + btnH) {
      if (currentPhase < 3) currentPhase++;
      else state = "LOADING";
    }
  }
  else if (state === "GALLERY") {
    if (dist(mouseX, mouseY, ICON_D, height - ICON_D) < 60) { resetDrawing(); state = "WELCOME"; }
    if (dist(mouseX, mouseY, width - ICON_D, height - ICON_D) < 60) { resetDrawing(); state = "DRAWING"; }
  }
}

// ============================================================
// DATA HELPERS
// ============================================================
function addToDatabase() {
  let cellW = width  / GRID_COLS;
  let cellH = height / GRID_ROWS;
  let idx   = database.length % (GRID_COLS * GRID_ROWS);
  let col   = idx % GRID_COLS;
  let row   = floor(idx / GRID_COLS);

  let hexShift = (row % 2 === 1) ? cellW * HEX_OFFSET : 0;
  let cx = (col * cellW + cellW / 2 + hexShift) % width;
  let cy = row * cellH + cellH / 2;

  database.push({
    frames:      JSON.parse(JSON.stringify(drawings)),
    x:           cx + random(-cellW * 0.22, cellW * 0.22),
    y:           cy + random(-cellH * 0.22, cellH * 0.22),
    seed:        random(TWO_PI),
    speed:       random(0.018, 0.038),
    amplitude:   random(12, 28),
    // Random offset so each jelly cycles phases at a different time
    phaseOffset: floor(random(PHASE_FRAMES * 3))
  });
}

function resetDrawing() {
  currentPhase = 1;
  drawings     = [[], [], []];
}
