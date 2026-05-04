// ============================================================
// Jellyfish Observation Station — Israel Aquarium
// sketch.js — p5.js sketch (place alongside index.html)
// ============================================================

let state = "WELCOME"; // WELCOME | DRAWING | LOADING | GALLERY

let currentPhase = 1;
let drawings = [[], [], []];
let isDrawing = false;

let database = []; // persistent across sessions via Supabase
let penSize = 3;
let loadingCounter = 0;
let fontBold, fontRegular, loadingImage;

// ── Color Palette ───────────────────────────────────────────
const LILAC  = [156, 161, 209]; // #9ca1d1
const WHITE  = 255;
const GRAY   = 160;
const DARK_GRAY = 40;           // bounding box fill
const STROKE_GRAY = 55;         // bounding box border

// ── Drawing canvas bounding box (centered, gives clear area) ─
const BOX_W = 900;
const BOX_H = 620;

// ── Grid for gallery (5 cols × 4 rows = 20 cells) ───────────
const GRID_COLS = 5;
const GRID_ROWS = 4;
const CELL_W    = 1920 / GRID_COLS; // 384
const CELL_H    = 1080 / GRID_ROWS; // 270

// ── Icon size (spec: 85px, both home and + must match) ───────
const ICON_D = 85;

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
  fontBold    = loadFont('Abraham-Bold.otf');
  fontRegular = loadFont('Abraham-Regular.otf');
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
// SCREEN 1 — WELCOME
// ============================================================
function drawWelcome() {
  noStroke();

  // ── Titles (centered as a block) ──────────────────────────
  textFont(fontBold);
  textSize(60);
  textAlign(CENTER, TOP);

  fill(...LILAC);
  text("תחנת תצפית מדוזות", width / 2, 120);
  fill(WHITE);
  text("محطة مراقبة قنديل البحر", width / 2, 200);
  fill(GRAY);
  text("Jellyfish Observation Station", width / 2, 280);

  // ── Description paragraphs ────────────────────────────────
  // Each language block: label left-aligned within a fixed column
  textFont(fontRegular);
  textSize(20);

  const COL_X = 360;          // left edge of text column
  const COL_W = 1200;         // column width
  const LINE_H = 34;

  // Hebrew — white, RIGHT-aligned (RTL)
  fill(WHITE);
  textAlign(RIGHT, TOP);
  text(
    "האקווריום הישראלי חוקר את תהליך הרבייה של מדוזות. אניה, סטודנטית לתקשורת חזותית בבצלאל, יצרה את 'פרויקט רבייה' כחלק מקורס איור מדעי. תוכלו לקחת חלק בפרויקט ולהוסיף מדוזה משלכם לתצפיות של אחרים. זכרו: אין נכון או לא נכון בתצפית. לכל אחד מאיתנו חוויה ייחודית, ויחד ניצור משהו יפה.",
    COL_X + COL_W, 400, COL_W
  );

  // Arabic — gray, RIGHT-aligned (RTL)
  fill(GRAY);
  textAlign(RIGHT, TOP);
  text(
    "يقوم الأكواريوم الإسرائيلي بالبحث في عملية تكاثر قناديل البحر. أنيا، طالبة الاتصالات المرئية في بتسلئيل، أنشأت 'مشروع التكاثر' كجزء من مساق الرسوم التوضيحية العلمية. يمكنك المشاركة في هذا المشروع التفاعلي عن طريق إضافة قنديل البحر الخاص بك إلى ملاحظات الآخرين. تذكر: لا يوجد صح أو خطأ في الملاحظة.",
    COL_X + COL_W, 560, COL_W
  );

  // English — gray, LEFT-aligned (LTR)
  fill(GRAY);
  textAlign(LEFT, TOP);
  text(
    "The Israel Aquarium researches jellyfish reproduction. Anya, a Visual Communications student at Bezalel, created her own 'Reproduction Project' for a scientific illustration course. You can participate by adding your jellyfish. There is no right or wrong: every observation is unique, and together we create something beautiful.",
    COL_X, 710, COL_W
  );

  // ── Start (+ / Add) button ────────────────────────────────
  drawPlusIcon(width / 2, 950);
}

// ============================================================
// SCREEN 2 — DRAWING
// ============================================================

// Dark bounding box so visitors know the drawing area
function drawBoundingBox() {
  let bx = (width  - BOX_W) / 2;
  let by = (height - BOX_H) / 2 - 60; // shift up to leave room for UI strip

  noFill();
  stroke(STROKE_GRAY);
  strokeWeight(1.5);
  rect(bx, by, BOX_W, BOX_H, 4);

  // Subtle fill so the canvas area reads as distinct
  fill(DARK_GRAY);
  noStroke();
  rect(bx, by, BOX_W, BOX_H, 4);
}

function drawCanvas() {
  let bx = (width  - BOX_W) / 2;
  let by = (height - BOX_H) / 2 - 60;

  stroke(211);
  strokeWeight(penSize);
  noFill();

  for (let path of drawings[currentPhase - 1]) {
    beginShape();
    for (let p of path) {
      vertex(p.x, p.y);
    }
    endShape();
  }

  // Live stroke while mouse held inside box
  if (mouseIsPressed && isInsideBox(mouseX, mouseY)) {
    let currentPaths = drawings[currentPhase - 1];
    if (currentPaths.length > 0) {
      currentPaths[currentPaths.length - 1].push({ x: mouseX, y: mouseY });
    }
  }
}

function isInsideBox(mx, my) {
  let bx = (width  - BOX_W) / 2;
  let by = (height - BOX_H) / 2 - 60;
  return mx > bx && mx < bx + BOX_W && my > by && my < by + BOX_H;
}

function drawDrawingInstructions() {
  const p = PHASES[currentPhase - 1];
  const STRIP_Y = height - 190; // instruction strip baseline
  const MARGIN  = 200;
  const TW      = width - MARGIN * 2;

  noStroke();
  textFont(fontRegular);
  textSize(22);

  // Phase indicator dots
  for (let i = 1; i <= 3; i++) {
    if (i === currentPhase) { fill(WHITE); noStroke(); ellipse(width / 2 + (i - 2) * 30, STRIP_Y - 30, 8, 8); }
    else { noFill(); stroke(GRAY); strokeWeight(1); ellipse(width / 2 + (i - 2) * 30, STRIP_Y - 30, 8, 8); }
  }
  noStroke();

  // Hebrew — right-aligned
  fill(WHITE);
  textAlign(RIGHT, TOP);
  text(p.he, MARGIN + TW, STRIP_Y, TW);

  // Arabic — right-aligned
  fill(GRAY);
  textAlign(RIGHT, TOP);
  text(p.ar, MARGIN + TW, STRIP_Y + 36, TW);

  // English — left-aligned
  fill(GRAY);
  textAlign(LEFT, TOP);
  text(p.en, MARGIN, STRIP_Y + 72, TW);
}

function drawUI() {
  // RESTART button (left of center)
  drawRoundedButton(width / 2 - 200, height - 55, 160, 44, "אתחול", "RESTART");
  // SEND button (right of center)
  drawRoundedButton(width / 2 + 40,  height - 55, 160, 44, "שליחה", "SEND");
}

function drawRoundedButton(x, y, w, h, labelHe, labelEn) {
  let cx = x + w / 2;
  let cy = y + h / 2;
  let hovered = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;

  noFill();
  stroke(hovered ? WHITE : GRAY);
  strokeWeight(1.5);
  rect(x, y, w, h, 22);

  noStroke();
  fill(hovered ? WHITE : GRAY);
  textFont(fontRegular);
  textSize(15);
  textAlign(CENTER, CENTER);
  text(`${labelHe} / ${labelEn}`, cx, cy);
}

// ============================================================
// SCREEN 3 — LOADING
// ============================================================
function drawLoading() {
  background(0);

  let yFloat = sin(frameCount * 0.05) * 18;
  imageMode(CENTER);
  image(loadingImage, width / 2, height / 2 - 120 + yFloat, 380, 380);

  noStroke();
  textFont(fontRegular);

  const CY = height / 2 + 170;

  // Hebrew — right-aligned
  fill(WHITE);
  textSize(26);
  textAlign(RIGHT, TOP);
  text("המדוזה שלך עוברת תהליך רבייה ובקרוב תצטרף לאחרות", width / 2 + 500, CY, 1000);

  // Arabic — right-aligned
  fill(GRAY);
  textSize(22);
  textAlign(RIGHT, TOP);
  text("قنديل البحر الخاص بك يمر بمرحلة التكاثر وسينضم إلى الآخرين قريباً", width / 2 + 500, CY + 44, 1000);

  // English — left-aligned
  fill(GRAY);
  textSize(22);
  textAlign(LEFT, TOP);
  text("Your jellyfish is going through a reproduction phase. It will join the others soon.", width / 2 - 500, CY + 88, 1000);

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

    // Each jelly shows its single assigned phase (not cycling)
    for (let path of jelly.frames[jelly.phaseIdx]) {
      beginShape();
      for (let p of path) {
        vertex(p.x - width / 2, p.y - (height / 2 - 60));
      }
      endShape();
    }
    pop();
  }

  // ── Bottom nav: Home (left) and + (right), same size ──────
  drawHomeIcon(100, height - 80);
  drawPlusIcon(width - 100, height - 80);
}

// ============================================================
// ICONS
// ============================================================

// Plus / Add icon — circle with crosshair
function drawPlusIcon(x, y) {
  let hovered = dist(mouseX, mouseY, x, y) < ICON_D / 2;
  let c = hovered ? WHITE : GRAY;

  noFill();
  stroke(c);
  strokeWeight(1.5);
  ellipse(x, y, ICON_D, ICON_D);

  stroke(c);
  line(x - 18, y, x + 18, y);
  line(x, y - 18, x, y + 18);
}

// Home icon — house shape, bounding box = ICON_D × ICON_D
function drawHomeIcon(x, y) {
  let hovered = dist(mouseX, mouseY, x, y) < ICON_D / 2;
  let c = hovered ? WHITE : GRAY;
  let s = ICON_D * 0.42; // half-size of icon body

  noFill();
  stroke(c);
  strokeWeight(1.5);

  // Roof (triangle peak)
  let roofH = s * 0.55;
  triangle(x, y - s, x - s, y - s + roofH, x + s, y - s + roofH);

  // Walls + floor (rectangle beneath roof)
  let wallTop = y - s + roofH;
  let wallH   = s * 0.95;
  rect(x - s * 0.6, wallTop, s * 1.2, wallH, 2);

  // Door (centered, bottom of walls)
  let dw = s * 0.38;
  let dh = s * 0.52;
  rect(x - dw / 2, wallTop + wallH - dh, dw, dh, 2);
}

// ============================================================
// MOUSE EVENTS
// ============================================================
function mousePressed() {
  // ── WELCOME ───────────────────────────────────────────────
  if (state === "WELCOME") {
    if (dist(mouseX, mouseY, width / 2, 950) < ICON_D / 2) {
      state = "DRAWING";
    }
  }

  // ── DRAWING ───────────────────────────────────────────────
  else if (state === "DRAWING") {
    // Start a new stroke inside the bounding box
    if (isInsideBox(mouseX, mouseY)) {
      drawings[currentPhase - 1].push([]);
    }

    // RESTART button
    let rx = width / 2 - 200, ry = height - 55, rw = 160, rh = 44;
    if (mouseX > rx && mouseX < rx + rw && mouseY > ry && mouseY < ry + rh) {
      drawings[currentPhase - 1] = [];
    }

    // SEND button
    let sx = width / 2 + 40, sy = height - 55, sw = 160, sh = 44;
    if (mouseX > sx && mouseX < sx + sw && mouseY > sy && mouseY < sy + sh) {
      if (currentPhase < 3) {
        currentPhase++;
      } else {
        state = "LOADING";
      }
    }
  }

  // ── GALLERY ───────────────────────────────────────────────
  else if (state === "GALLERY") {
    // Home icon → back to welcome
    if (dist(mouseX, mouseY, 100, height - 80) < ICON_D / 2) {
      resetDrawing();
      state = "WELCOME";
    }
    // Plus icon → new drawing
    if (dist(mouseX, mouseY, width - 100, height - 80) < ICON_D / 2) {
      resetDrawing();
      state = "DRAWING";
    }
  }
}

// ============================================================
// DATA HELPERS
// ============================================================

// Grid-based placement: assign a cell, spawn within its center 50%
function addToDatabase() {
  let cellIdx = database.length % (GRID_COLS * GRID_ROWS);
  let col     = cellIdx % GRID_COLS;
  let row     = floor(cellIdx / GRID_COLS);

  // Center 50% of each cell
  let cx = col * CELL_W + CELL_W / 2;
  let cy = row * CELL_H + CELL_H / 2;
  let jx = cx + random(-CELL_W * 0.25, CELL_W * 0.25);
  let jy = cy + random(-CELL_H * 0.25, CELL_H * 0.25);

  database.push({
    frames:    JSON.parse(JSON.stringify(drawings)),
    phaseIdx:  floor(random(3)), // each jelly shows one fixed phase
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
