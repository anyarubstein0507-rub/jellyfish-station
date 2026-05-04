// ============================================================
// Jellyfish Observation Station — Israel Aquarium
// sketch.js v3 — all fixes applied
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
const GRAY  = 160;

// ── Icon size (home + plus must match exactly) ───────────────
const ICON_D = 85;

// ── Hex grid config ──────────────────────────────────────────
const GRID_COLS  = 5;
const GRID_ROWS  = 4;
const HEX_OFFSET = 0.5;

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
  fill(GRAY);
  text("Jellyfish Observation Station", width / 2, 320);

  // ── Three-column paragraph grid ───────────────────────────
  // Each column: 500px wide, centers at 330 / 960 / 1590
  // Gutter between columns: 60px
  const COL_W    = 500;
  const COL_TOP  = 430;  // top of paragraph area
  const COL_HALF = COL_W / 2;

  textFont(fontRegular);
  textSize(20);
  textAlign(CENTER, TOP); // all three columns center-aligned

  // Left column — English, Gray
  fill(GRAY);
  text(
    "The Israel Aquarium researches jellyfish reproduction. Anya, a Visual Communications student at Bezalel, created her own 'Reproduction Project' for a scientific illustration course. You can participate by adding your jellyfish. There is no right or wrong: every observation is unique, and together we create something beautiful.",
    330 - COL_HALF, COL_TOP, COL_W
  );

  // Middle column — Arabic, Gray
  fill(GRAY);
  text(
    "يقوم الأكواريوم الإسرائيلي بالبحث في عملية تكاثر قناديل البحر. أنيا، طالبة الاتصالات المرئية في بتسلئيل، أنشأت 'مشروع التكاثر' كجزء من مساق الرسوم التوضيحية العلمية. يمكنك المشاركة في هذا المشروع التفاعلي عن طريق إضافة قنديل البحر الخاص بك إلى ملاحظات الآخرين. تذكر: لا يوجد صح أو خطأ في الملاحظة.",
    960 - COL_HALF, COL_TOP, COL_W
  );

  // Right column — Hebrew, White
  fill(WHITE);
  text(
    "האקווריום הישראלי חוקר את תהליך הרבייה של מדוזות. אניה, סטודנטית לתקשורת חזותית בבצלאל, יצרה את 'פרויקט רבייה' כחלק מקורס איור מדעי. תוכלו לקחת חלק בפרויקט ולהוסיף מדוזה משלכם לתצפיות של אחרים. זכרו: אין נכון או לא נכון בתצפית. לכל אחד מאיתנו חוויה ייחודית, ויחד ניצור משהו יפה.",
    1590 - COL_HALF, COL_TOP, COL_W
  );

  // ── Plus / start button at Y=940 ─────────────────────────
  drawPlusIcon(width / 2, 940);
}

// ============================================================
// SCREEN 2 — DRAWING
// ============================================================
function boxBounds() {
  let bw = width  * 0.52;
  let bh = height * 0.62;
  let bx = (width  - bw) / 2;
  let by = (height - bh) / 2 - height * 0.06;
  return { bx, by, bw, bh };
}

function drawBoundingBox() {
  let { bx, by, bw, bh } = boxBounds();
  noFill();                  // outline only — no fill
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
  const p      = PHASES[currentPhase - 1];
  const stripY = height * 0.78;
  const margin = width * 0.1;
  const tw     = width - margin * 2;

  noStroke();
  textFont(fontRegular);
  textSize(20);

  // Phase dots
  for (let i = 1; i <= 3; i++) {
    let dx = width / 2 + (i - 2) * 28;
    let dy = stripY - 28;
    if (i === currentPhase) {
      fill(WHITE); noStroke();
      ellipse(dx, dy, 8, 8);
    } else {
      noFill(); stroke(GRAY); strokeWeight(1);
      ellipse(dx, dy, 8, 8);
    }
  }
  noStroke();

  // Hebrew — right-aligned (RTL)
  fill(WHITE);
  textAlign(RIGHT, TOP);
  text(p.he, margin + tw, stripY, tw);

  // Arabic — right-aligned (RTL)
  fill(GRAY);
  textAlign(RIGHT, TOP);
  text(p.ar, margin + tw, stripY + 34, tw);

  // English — left-aligned (LTR)
  fill(GRAY);
  textAlign(LEFT, TOP);
  text(p.en, margin, stripY + 68, tw);
}

function drawUI() {
  let btnH = 44;
  let btnW = 160;
  let btnY = height * 0.945 - btnH / 2;
  drawRoundedButton(width / 2 - btnW - 20, btnY, btnW, btnH, "אתחול", "RESTART");
  drawRoundedButton(width / 2 + 20,        btnY, btnW, btnH, "שליחה",  "SEND");
}

function drawRoundedButton(x, y, w, h, labelHe, labelEn) {
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
  text(`${labelHe} / ${labelEn}`, x + w / 2, y + h / 2);
}

// ============================================================
// SCREEN 3 — LOADING
// ============================================================
function drawLoading() {
  background(0);

  let yFloat = sin(frameCount * 0.05) * 18;
  imageMode(CENTER);
  image(loadingImage, width / 2, height * 0.38 + yFloat, 360, 360);

  noStroke();
  textFont(fontRegular);

  let colW  = width * 0.52;
  let colX  = (width - colW) / 2;
  let baseY = height * 0.68;

  // Hebrew — right-aligned
  fill(WHITE);
  textSize(24);
  textAlign(RIGHT, TOP);
  text(
    "המדוזה שלך עוברת תהליך רבייה ובקרוב תצטרף לאחרות",
    colX + colW, baseY, colW
  );

  // Arabic — right-aligned
  fill(GRAY);
  textSize(20);
  textAlign(RIGHT, TOP);
  text(
    "قنديل البحر الخاص بك يمر بمرحلة التكاثر وسينضم إلى الآخرين قريباً",
    colX + colW, baseY + 44, colW
  );

  // English — left-aligned
  fill(GRAY);
  textSize(20);
  textAlign(LEFT, TOP);
  text(
    "Your jellyfish is going through a reproduction phase. It will join the others soon.",
    colX, baseY + 86, colW
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

    // Center drawing around 0,0 using the box center it was drawn in
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

  // Bottom nav — home left, plus right
  drawHomeIcon(ICON_D * 0.7, height - ICON_D * 0.7);
  drawPlusIcon(width - ICON_D * 0.7, height - ICON_D * 0.7);
}

// ============================================================
// ICONS
// ============================================================

function drawPlusIcon(x, y) {
  let hovered = dist(mouseX, mouseY, x, y) < 60;
  let c = hovered ? WHITE : GRAY;
  noFill();
  stroke(c);
  strokeWeight(1.5);
  ellipse(x, y, ICON_D, ICON_D);
  line(x - 16, y, x + 16, y);
  line(x, y - 16, x, y + 16);
}

// Minimalist home: V-shape, rounded roof arc, 4px overhang, no top line
function drawHomeIcon(x, y) {
  let hovered = dist(mouseX, mouseY, x, y) < 60;
  let c = hovered ? WHITE : GRAY;

  stroke(c);
  strokeWeight(1.5);
  noFill();

  let s   = ICON_D * 0.38;
  let ovr = 4;

  let wallL    = x - s * 0.62;
  let wallR    = x + s * 0.62;
  let roofBase = y - s * 0.1;
  let roofPeak = y - s * 1.0;

  // Rounded roof arc — bezier from left overhang to right overhang
  // No flat top line: open shape
  beginShape();
  vertex(wallL - ovr, roofBase);
  bezierVertex(
    wallL - ovr, roofPeak + (roofBase - roofPeak) * 0.3,
    wallR + ovr, roofPeak + (roofBase - roofPeak) * 0.3,
    wallR + ovr, roofBase
  );
  endShape(); // open — no closing line at top

  // Left and right walls
  let wallBottom = y + s * 0.88;
  line(wallL, roofBase, wallL, wallBottom);
  line(wallR, roofBase, wallR, wallBottom);

  // Floor
  line(wallL, wallBottom, wallR, wallBottom);

  // Door — centered at bottom
  let dw = s * 0.42;
  let dh = s * 0.55;
  rect(x - dw / 2, wallBottom - dh, dw, dh, 2);
}

// ============================================================
// MOUSE EVENTS
// ============================================================
function mousePressed() {
  if (state === "WELCOME") {
    if (dist(mouseX, mouseY, width / 2, 940) < 60) {
      state = "DRAWING";
    }
  }

  else if (state === "DRAWING") {
    if (isInsideBox(mouseX, mouseY)) {
      drawings[currentPhase - 1].push([]);
    }

    let btnH = 44, btnW = 160;
    let btnY = height * 0.945 - btnH / 2;

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
    if (dist(mouseX, mouseY, ICON_D * 0.7, height - ICON_D * 0.7) < 60) {
      resetDrawing();
      state = "WELCOME";
    }
    if (dist(mouseX, mouseY, width - ICON_D * 0.7, height - ICON_D * 0.7) < 60) {
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

  // Hex offset: odd rows shift by half a cell
  let hexShift = (row % 2 === 1) ? cellW * HEX_OFFSET : 0;
  let cx = col * cellW + cellW / 2 + hexShift;
  let cy = row * cellH + cellH / 2;

  // Wrap if hex shift pushes past right edge
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
