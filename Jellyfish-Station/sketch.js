// ============================================================
// Jellyfish Observation Station — Israel Aquarium
// sketch.js v5 — RTL fix, layout polish, loading titles
// ============================================================

let state = "WELCOME";
let currentPhase = 1;
let drawings = [[], [], []];
let database = [];
let penSize = 3;
let loadingCounter = 0;
let fontBold, fontRegular, loadingImage;
let ctx; // raw canvas 2D context for RTL text

// ── Color Palette ───────────────────────────────────────────
const LILAC    = [156, 161, 209];
const WHITE    = 255;
const INK_GRAY = 160;

// ── Icon diameter ────────────────────────────────────────────
const ICON_D = 85;

// ── Hex grid ─────────────────────────────────────────────────
const GRID_COLS  = 5;
const GRID_ROWS  = 4;
const HEX_OFFSET = 0.5;

// ── Column centers (1920px canvas) ──────────────────────────
const COL_W    = 500;
const COL_EN_C = 330;   // center X of English column
const COL_AR_C = 960;   // center X of Arabic column
const COL_HE_C = 1590;  // center X of Hebrew column

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
  // Grab raw canvas context for RTL rendering
  ctx = document.querySelector('canvas').getContext('2d');
}

// ============================================================
// DRAW LOOP
// ============================================================
function draw() {
  background(0);
  if      (state === "WELCOME")  drawWelcome();
  else if (state === "DRAWING")  { drawBoundingBox(); drawCanvas(); drawDrawingInstructions(); drawUI(); }
  else if (state === "LOADING")  drawLoading();
  else if (state === "GALLERY")  drawGallery();
}

// ============================================================
// RTL TEXT HELPER
// Renders a wrapped RTL string (Hebrew or Arabic) using the
// raw canvas context, which respects unicode-bidi correctly.
// x, y = top-left of the text block; maxW = wrap width
// fontStr = full CSS font string e.g. "20px AbrahamRegular"
// color = CSS color string e.g. "rgb(255,255,255)"
// ============================================================
function rtlText(str, x, y, maxW, fontStr, colorStr, centerAlign) {
  ctx.save();
  ctx.direction = 'rtl';
  ctx.font      = fontStr;
  ctx.fillStyle = colorStr;
  ctx.textAlign = centerAlign ? 'center' : 'right';

  // Manual word-wrap
  let words    = str.split(' ');
  let line     = '';
  let lineH    = parseInt(fontStr) * 1.55;
  let curY     = y + parseInt(fontStr); // baseline offset

  for (let w of words) {
    let test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      let drawX = centerAlign ? x + maxW / 2 : x + maxW;
      ctx.fillText(line, drawX, curY);
      line = w;
      curY += lineH;
    } else {
      line = test;
    }
  }
  if (line) {
    let drawX = centerAlign ? x + maxW / 2 : x + maxW;
    ctx.fillText(line, drawX, curY);
  }

  ctx.restore();
}

// ============================================================
// TRILINGUAL COLUMN BLOCK
// Draws EN (p5 LTR), AR (RTL), HE (RTL) side by side
// fontSz: px size for all three
// enColor / arColor / heColor: p5 color values (numbers)
// boldTitles: if true uses Abraham Bold font string
// ============================================================
function drawTrilingualColumns(colTop, fontSz, enStr, arStr, heStr,
                                enColor, arColor, heColor, useBold) {
  let fName  = useBold ? 'AbrahamBold' : 'AbrahamRegular';
  let fStr   = fontSz + 'px ' + fName;
  let lineH  = fontSz * 1.55;

  // ── English — p5 LTR, center-aligned ─────────────────────
  noStroke();
  fill(enColor !== undefined ? enColor : INK_GRAY);
  textFont(useBold ? fontBold : fontRegular);
  textSize(fontSz);
  textAlign(CENTER, TOP);
  text(enStr, COL_EN_C - COL_W / 2, colTop, COL_W);

  // ── Arabic — RTL via raw canvas, center-aligned ───────────
  let arCSS = colorToCSS(arColor !== undefined ? arColor : INK_GRAY);
  rtlText(arStr, COL_AR_C - COL_W / 2, colTop, COL_W, fStr, arCSS, true);

  // ── Hebrew — RTL via raw canvas, center-aligned ───────────
  let heCSS = colorToCSS(heColor !== undefined ? heColor : WHITE);
  rtlText(heStr, COL_HE_C - COL_W / 2, colTop, COL_W, fStr, heCSS, true);
}

// Convert p5 color number or array to CSS string
function colorToCSS(c) {
  if (Array.isArray(c)) return `rgb(${c[0]},${c[1]},${c[2]})`;
  return `rgb(${c},${c},${c})`;
}

// ============================================================
// SCREEN 1 — WELCOME
// ============================================================
function drawWelcome() {
  noStroke();

  // ── Titles — centered, using p5 (Latin layout is fine) ───
  textFont(fontBold);
  textSize(60);
  textAlign(CENTER, TOP);

  // Hebrew title — RTL raw canvas
  rtlText("תחנת תצפית מדוזות", width/2 - 400, 130, 800,
    '60px AbrahamBold', `rgb(${LILAC[0]},${LILAC[1]},${LILAC[2]})`, true);

  // Arabic title — RTL raw canvas
  rtlText("محطة مراقبة قنديل البحر", width/2 - 500, 210, 1000,
    '60px AbrahamBold', 'rgb(255,255,255)', true);

  // English title — p5 LTR
  fill(INK_GRAY);
  textAlign(CENTER, TOP);
  text("Jellyfish Observation Station", width / 2, 295);

  // ── Three-column paragraphs ───────────────────────────────
  drawTrilingualColumns(
    410, 20,
    "The Israel Aquarium researches jellyfish reproduction. Anya, a Visual Communications student at Bezalel, created her own 'Reproduction Project' for a scientific illustration course. You can participate by adding your jellyfish. There is no right or wrong: every observation is unique, and together we create something beautiful.",
    "يقوم الأكواريوم الإسرائيلي بالبحث في عملية تكاثر قناديل البحر. أنيا، طالبة الاتصالات المرئية في بتسلئيل، أنشأت 'مشروع التكاثر' كجزء من مساق الرسوم التوضيحية العلمية. يمكنك المشاركة في هذا المشروع التفاعلي عن طريق إضافة قنديل البحر الخاص بك إلى ملاحظات الآخرين. تذكر: لا يوجد صح أو خطأ في الملاحظة.",
    "האקווריום הישראלי חוקר את תהליך הרבייה של מדוזות. אניה, סטודנטית לתקשורת חזותית בבצלאל, יצרה את 'פרויקט רבייה' כחלק מקורס איור מדעי. תוכלו לקחת חלק בפרויקט ולהוסיף מדוזה משלכם לתצפיות של אחרים. זכרו: אין נכון או לא נכון בתצפית. לכל אחד מאיתנו חוויה ייחודית, ויחד ניצור משהו יפה.",
    INK_GRAY, INK_GRAY, WHITE
  );

  // ── Plus button ───────────────────────────────────────────
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

  // Phase dots — 24px gap below box
  const DOT_Y = boxBottom + 30;
  for (let i = 1; i <= 3; i++) {
    let dx = width / 2 + (i - 2) * 20;
    if (i === currentPhase) {
      fill(WHITE); noStroke(); ellipse(dx, DOT_Y, 8, 8);
    } else {
      noFill(); stroke(INK_GRAY); strokeWeight(1); ellipse(dx, DOT_Y, 8, 8);
    }
  }
  noStroke();

  // Instructions — 20px below dots
  const TEXT_TOP = DOT_Y + 20;
  const p = PHASES[currentPhase - 1];
  drawTrilingualColumns(TEXT_TOP, 18, p.en, p.ar, p.he,
    INK_GRAY, INK_GRAY, WHITE);
}

function drawUI() {
  // Buttons sit higher — 110px from bottom
  let btnH = 44, btnW = 160;
  let btnY = height - 110;
  drawRoundedButton(width / 2 - btnW - 20, btnY, btnW, btnH, "אתחול", "RESTART");
  drawRoundedButton(width / 2 + 20,        btnY, btnW, btnH, "שליחה",  "SEND");
}

function drawRoundedButton(x, y, w, h, labelHe, labelEn) {
  let hovered = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  noFill();
  stroke(hovered ? WHITE : INK_GRAY);
  strokeWeight(1.5);
  rect(x, y, w, h, 22);
  noStroke();
  fill(hovered ? WHITE : INK_GRAY);
  textFont(fontRegular);
  textSize(15);
  textAlign(CENTER, CENTER);
  text(`${labelHe} / ${labelEn}`, x + w / 2, y + h / 2);
}

// ============================================================
// SCREEN 3 — LOADING
// ============================================================
function drawLoading() {
  background(0);

  let yFloat = sin(frameCount * 0.05) * 18;
  imageMode(CENTER);
  image(loadingImage, width / 2, height * 0.36 + yFloat, 340, 340);

  // Loading titles — same style as home titles, half size (30px)
  // Hebrew — Lilac
  rtlText("המדוזה שלך עוברת תהליך רבייה ובקרוב תצטרף לאחרות",
    width/2 - 500, height * 0.63, 1000,
    '30px AbrahamBold', `rgb(${LILAC[0]},${LILAC[1]},${LILAC[2]})`, true);

  // Arabic — White
  rtlText("قنديل البحر الخاص بك يمر بمرحلة التكاثر وسينضم إلى الآخرين قريباً",
    width/2 - 500, height * 0.63 + 52, 1000,
    '30px AbrahamBold', 'rgb(255,255,255)', true);

  // English — Gray, p5 LTR
  noStroke();
  fill(INK_GRAY);
  textFont(fontBold);
  textSize(30);
  textAlign(CENTER, TOP);
  text("Your jellyfish is going through a reproduction phase. It will join the others soon.",
    width/2 - 500, height * 0.63 + 104, 1000);

  loadingCounter++;
  if (loadingCounter > 240) {
    addToDatabase();
    state = "GALLERY";
    loadingCounter = 0;
  }
}

// ============================================================
// SCREEN 4 — GALLERY
// ============================================================
function drawGallery() {
  for (let jelly of database) {
    let yFloat = sin(frameCount * jelly.speed + jelly.seed) * jelly.amplitude;
    push();
    translate(jelly.x, jelly.y + yFloat);
    scale(0.28);
    stroke(211);
    strokeWeight(penSize * 3.5);
    noFill();
    let { bx, by, bw, bh } = boxBounds();
    let cx = bx + bw / 2;
    let cy = by + bh / 2;
    for (let path of jelly.frames[jelly.phaseIdx]) {
      beginShape();
      for (let p of path) vertex(p.x - cx, p.y - cy);
      endShape();
    }
    pop();
  }
  drawHomeIcon(ICON_D, height - ICON_D);
  drawPlusIcon(width - ICON_D, height - ICON_D);
}

// ============================================================
// ICONS
// ============================================================
function drawPlusIcon(x, y) {
  let hovered = dist(mouseX, mouseY, x, y) < 60;
  let c = hovered ? WHITE : INK_GRAY;
  noFill(); stroke(c); strokeWeight(1.5);
  ellipse(x, y, ICON_D, ICON_D);
  line(x - 16, y, x + 16, y);
  line(x, y - 16, x, y + 16);
}

// Home: V-roof + open square body, no door
function drawHomeIcon(x, y) {
  let hovered = dist(mouseX, mouseY, x, y) < 60;
  let c = hovered ? WHITE : INK_GRAY;
  stroke(c); strokeWeight(1.5); noFill();

  let half     = ICON_D * 0.36;
  let bodyH    = ICON_D * 0.38;
  let roofH    = ICON_D * 0.28;
  let ovr      = ICON_D * 0.06;
  let bodyTop  = y - bodyH / 2 + roofH * 0.3;
  let bodyBot  = bodyTop + bodyH;
  let peakY    = bodyTop - roofH;
  let bodyL    = x - half;
  let bodyR    = x + half;

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
    let rx = width / 2 - btnW - 20;
    if (mouseX > rx && mouseX < rx + btnW && mouseY > btnY && mouseY < btnY + btnH)
      drawings[currentPhase - 1] = [];

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
    frames:    JSON.parse(JSON.stringify(drawings)),
    phaseIdx:  floor(random(3)),
    x:         cx + random(-cellW * 0.22, cellW * 0.22),
    y:         cy + random(-cellH * 0.22, cellH * 0.22),
    seed:      random(TWO_PI),
    speed:     random(0.018, 0.038),
    amplitude: random(12, 28)
  });
}

function resetDrawing() {
  currentPhase = 1;
  drawings     = [[], [], []];
}
