// ============================================================
// Jellyfish Observation Station — Israel Aquarium
// sketch.js v4
// ============================================================

let state = "WELCOME";
let currentPhase = 1;
let drawings = [[], [], []];
let database = [];
let penSize = 3;
let loadingCounter = 0;
let fontBold, fontRegular, loadingImage;

// ── Color Palette ───────────────────────────────────────────
const LILAC = [156, 161, 209];
const WHITE = 255;
const INK_GRAY  = 160;

// ── Icon diameter — home V and plus circle must match exactly
const ICON_D = 85;

// ── Hex grid ─────────────────────────────────────────────────
const GRID_COLS  = 5;
const GRID_ROWS  = 4;
const HEX_OFFSET = 0.5;

// ── Column layout (shared across WELCOME, DRAWING, LOADING) ──
// Three equal columns, each 500px wide
// Centers: EN=330, AR=960, HE=1590
const COL_W = 500;
const COL_EN_X = 330 - COL_W / 2;   // left edge of English col
const COL_AR_X = 960 - COL_W / 2;   // left edge of Arabic col
const COL_HE_X = 1590 - COL_W / 2;  // left edge of Hebrew col

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
// HELPER — draw three-column trilingual text block
// colTop: Y position for top of text
// sizes: { en, ar, he } font sizes (default all 20)
// loading copy replaces phase copy when isLoading=true
// ============================================================
function drawTrilingualColumns(colTop, txtSize, enStr, arStr, heStr) {
  noStroke();
  textFont(fontRegular);
  textSize(txtSize || 20);

  // English — left col, center-aligned within col
  fill(INK_GRAY);
  textAlign(CENTER, TOP);
  text(enStr, COL_EN_X, colTop, COL_W);

  // Arabic — middle col, center-aligned within col
  fill(INK_GRAY);
  textAlign(CENTER, TOP);
  text(arStr, COL_AR_X, colTop, COL_W);

  // Hebrew — right col, center-aligned within col
  fill(WHITE);
  textAlign(CENTER, TOP);
  text(heStr, COL_HE_X, colTop, COL_W);
}

// ============================================================
// SCREEN 1 — WELCOME
// ============================================================
function drawWelcome() {
  noStroke();

  // ── Titles — centered at top ──────────────────────────────
  textFont(fontBold);
  textSize(60);
  textAlign(CENTER, TOP);

  fill(...LILAC);
  text("תחנת תצפית מדוזות", width / 2, 150);
  fill(WHITE);
  text("محطة مراقبة قنديل البحر", width / 2, 235);
  fill(INK_GRAY);
  text("Jellyfish Observation Station", width / 2, 320);

  // ── Three-column paragraphs ───────────────────────────────
  drawTrilingualColumns(
    430, 20,
    "The Israel Aquarium researches jellyfish reproduction. Anya, a Visual Communications student at Bezalel, created her own 'Reproduction Project' for a scientific illustration course. You can participate by adding your jellyfish. There is no right or wrong: every observation is unique, and together we create something beautiful.",
    "يقوم الأكواريوم الإسرائيلي بالبحث في عملية تكاثر قناديل البحر. أنيا، طالبة الاتصالات المرئية في بتسلئيل، أنشأت 'مشروع التكاثر' كجزء من مساق الرسوم التوضيحية العلمية. يمكنك المشاركة في هذا المشروع التفاعلي عن طريق إضافة قنديل البحر الخاص بك إلى ملاحظات الآخرين. تذكر: لا يوجد صح أو خطأ في الملاحظة.",
    "האקווריום הישראלי חוקר את תהליך הרבייה של מדוזות. אניה, סטודנטית לתקשורת חזותית בבצלאל, יצרה את 'פרויקט רבייה' כחלק מקורס איור מדעי. תוכלו לקחת חלק בפרויקט ולהוסיף מדוזה משלכם לתצפיות של אחרים. זכרו: אין נכון או לא נכון בתצפית. לכל אחד מאיתנו חוויה ייחודית, ויחד ניצור משהו יפה."
  );

  // ── Plus button — moved up to Y=880 ─────────────────────
  drawPlusIcon(width / 2, 880);
}

// ============================================================
// SCREEN 2 — DRAWING
// ============================================================

// Returns the bounding box rect for the drawing canvas
function boxBounds() {
  let bw = width  * 0.52;
  let bh = height * 0.55;   // slightly shorter to give room below
  let bx = (width  - bw) / 2;
  let by = height * 0.06;   // sits near top, leaving room for text below
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

  // ── Phase dots — 20px below box bottom ───────────────────
  const DOT_Y   = boxBottom + 20;
  const DOTS_GAP = 20;

  for (let i = 1; i <= 3; i++) {
    let dx = width / 2 + (i - 2) * DOTS_GAP;
    if (i === currentPhase) {
      fill(WHITE); noStroke();
      ellipse(dx, DOT_Y, 8, 8);
    } else {
      noFill(); stroke(INK_GRAY); strokeWeight(1);
      ellipse(dx, DOT_Y, 8, 8);
    }
  }

  // ── Three-column instructions — 20px below dots ──────────
  const TEXT_TOP = DOT_Y + 20;
  const p = PHASES[currentPhase - 1];
  drawTrilingualColumns(TEXT_TOP, 18, p.en, p.ar, p.he);
}

function drawUI() {
  let btnH = 44;
  let btnW = 160;
  let btnY = height - 70;
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

  // Three-column loading text below image
  drawTrilingualColumns(
    height * 0.64, 20,
    "Your jellyfish is going through a reproduction phase. It will join the others soon.",
    "قنديل البحر الخاص بك يمر بمرحلة التكاثر وسينضم إلى الآخرين قريباً",
    "המדוזה שלך עוברת תהליך רבייה ובקרוב תצטרף לאחרות"
  );

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

  // Bottom nav — home bottom-left, plus bottom-right
  // Inset by ICON_D so icons don't touch edges
  drawHomeIcon(ICON_D, height - ICON_D);
  drawPlusIcon(width - ICON_D, height - ICON_D);
}

// ============================================================
// ICONS
// ============================================================

// Plus — circle with crosshair. Diameter = ICON_D
function drawPlusIcon(x, y) {
  let hovered = dist(mouseX, mouseY, x, y) < 60;
  let c = hovered ? WHITE : INK_GRAY;
  noFill();
  stroke(c);
  strokeWeight(1.5);
  ellipse(x, y, ICON_D, ICON_D);
  line(x - 16, y, x + 16, y);
  line(x, y - 16, x, y + 16);
}

// Home — V-shape roof (two diagonal lines meeting at peak) +
// open rectangle body (no door, no top line).
// Bounding box = ICON_D × ICON_D, slightly rounded corners.
function drawHomeIcon(x, y) {
  let hovered = dist(mouseX, mouseY, x, y) < 60;
  let c = hovered ? WHITE : INK_GRAY;

  stroke(c);
  strokeWeight(1.5);
  noFill();

  // Proportions relative to ICON_D
  let half  = ICON_D * 0.36;   // half-width of body
  let bodyH = ICON_D * 0.38;   // height of body rectangle
  let roofH = ICON_D * 0.28;   // height of the V peak above body top
  let ovr   = ICON_D * 0.06;   // overhang on each side beyond body

  // Key Y positions
  let bodyTop    = y - bodyH / 2 + roofH * 0.3;
  let bodyBottom = bodyTop + bodyH;
  let peakY      = bodyTop - roofH;

  // Key X positions
  let bodyL = x - half;
  let bodyR = x + half;

  // V-shape roof: two straight lines from overhang points to peak
  line(bodyL - ovr, bodyTop, x, peakY);  // left slope
  line(bodyR + ovr, bodyTop, x, peakY);  // right slope

  // Body: open rectangle (3 sides — no top line)
  // Left wall
  line(bodyL, bodyTop, bodyL, bodyBottom);
  // Right wall
  line(bodyR, bodyTop, bodyR, bodyBottom);
  // Floor (with slight rounding via rect trick — use lines for simplicity)
  line(bodyL, bodyBottom, bodyR, bodyBottom);
}

// ============================================================
// MOUSE EVENTS
// ============================================================
function mousePressed() {

  if (state === "WELCOME") {
    if (dist(mouseX, mouseY, width / 2, 880) < 60) {
      state = "DRAWING";
    }
  }

  else if (state === "DRAWING") {
    if (isInsideBox(mouseX, mouseY)) {
      drawings[currentPhase - 1].push([]);
    }

    let btnH = 44, btnW = 160;
    let btnY = height - 70;

    // RESTART
    let rx = width / 2 - btnW - 20;
    if (mouseX > rx && mouseX < rx + btnW && mouseY > btnY && mouseY < btnY + btnH) {
      drawings[currentPhase - 1] = [];
    }

    // SEND
    let sx = width / 2 + 20;
    if (mouseX > sx && mouseX < sx + btnW && mouseY > btnY && mouseY < btnY + btnH) {
      if (currentPhase < 3) currentPhase++;
      else state = "LOADING";
    }
  }

  else if (state === "GALLERY") {
    if (dist(mouseX, mouseY, ICON_D, height - ICON_D) < 60) {
      resetDrawing();
      state = "WELCOME";
    }
    if (dist(mouseX, mouseY, width - ICON_D, height - ICON_D) < 60) {
      resetDrawing();
      state = "DRAWING";
    }
  }
}

// ============================================================
// DATA HELPERS
// ============================================================
function addToDatabase() {
  let cellW = width  / GRID_COLS;
  let cellH = height / GRID_ROWS;

  let idx = database.length % (GRID_COLS * GRID_ROWS);
  let col = idx % GRID_COLS;
  let row = floor(idx / GRID_COLS);

  let hexShift = (row % 2 === 1) ? cellW * HEX_OFFSET : 0;
  let cx = col * cellW + cellW / 2 + hexShift;
  let cy = row * cellH + cellH / 2;
  cx = cx % width;

  let jx = cx + random(-cellW * 0.22, cellW * 0.22);
  let jy = cy + random(-cellH * 0.22, cellH * 0.22);

  database.push({
    frames:    JSON.parse(JSON.stringify(drawings)),
    phaseIdx:  floor(random(3)),
    x:         jx,
    y:         jy,
    seed:      random(TWO_PI),
    speed:     random(0.018, 0.038),
    amplitude: random(12, 28)
  });
}

function resetDrawing() {
  currentPhase = 1;
  drawings     = [[], [], []];
}
