// ===== TUNING: every balance number in one place, so tweaking the game means editing only this list =====
const TUNE = {                // const: TUNE is never replaced, only read (and maybe edited by hand while tuning)
  baseCap: 100,               // stamina cap of an uninjured performer
  trickCost: 18,              // stamina spent per finished trick, drained gradually across the trick
  restRate: 8,                // stamina regained per second while resting
  injuryCapLoss: 20,          // cap lost per injury
  minCap: 20,                 // injuries can never push the cap below this
  basePay: 2,                 // coins per successful trick, before the material multipliers
  xpPerTrick: 3,
  xpBase: 30,
  xpGrowth: 2,              // XP per finished trick, before the material's XP multiplier
  scavTime: 3,                // seconds one scavenge takes
  scavMaterialChance: 0.8,    // decimal chance a scavenge finds a material (otherwise 3 coins); compared directly against Math.random()
  baseCost: 15,               // price of the first hire
  costGrowth: 1.5,            // each later hire costs 1.5 times the previous one
};

// ===== MATERIALS: one row per material, filed by name so MATERIALS[performer.material] finds it directly =====
const MATERIALS = {
  fabric: { repTime: 2.0, success: 0.60, pay: 1.0, crowd: 1.0, xp: 1 },  // quick reps
  wood:   { repTime: 2.25, success: 0.60, pay: 1.0, crowd: 1.0, xp: 2 },  // learns twice as fast
  clay:   { repTime: 3.0, success: 0.50, pay: 1.0, crowd: 1.3, xp: 1 },  // bigger crowd, shakier hands
  metal:  { repTime: 3.5, success: 0.60, pay: 1.5, crowd: 1.0, xp: 1 },  // pays more, works slower
  glass:  { repTime: 2.5, success: 0.55, pay: 1.0, crowd: 1.0, xp: 1 , perfChance: 0.1},  // its special Perfect rule comes next (your turn)
};

// ===== NAME PARTS: a random first + last gives each performer a name =====
const NAMES_FIRST = ["Fez", "Perri", "Bo", "Mungo", "Dot", "Fizz"];        // arrays, because we pick by random position
const NAMES_LAST  = ["Magnifico", "Puddle", "Figarro", "Galileo", "Tumble", "Ploof"];

// ===== GAME STATE: everything that changes during play, in one object =====
const game = {                                   // const: we change what's inside game, but never replace game itself
  coins: 0,                                      // spendable money
  hired: 0,                                      // how many hires so far; the next price is baseCost × costGrowth^hired
  nextId: 1,                                     // a counter so every performer gets a unique id, even if two share a name
  inv: { fabric: 0, wood: 0, clay: 0, metal: 0, glass: 0 },  // material counts, keyed by the same names as MATERIALS so lookups match
  scav: { active: false, t: 0 },                 // is a scavenge running, and how many seconds into it
  performers: [],                                // the troupe: an array, kept in hiring order
  log: [],                                       // recent event lines, newest first
};

// ===== HELPERS =====
function pick(list) {                            // returns one random item from any array
  return list[Math.floor(Math.random() * list.length)];   // same index math as the dice roller
}

function xpToNext(level) {                       // XP a performer at this level needs to level up
  return TUNE.xpBase * TUNE.xpGrowth ** (level - 1);   // level 1 → 30, level 2 → 60, level 3 → 120; (level − 1) so level 1 costs the base
}

function makePerformer(material) {               // builds one fresh performer of the given material
  return {                                       // returns a new object each call, so performers never share fields
    id: game.nextId++,                           // uses the current id, then adds 1 for next time (++ after the name means "use, then add")
    name: pick(NAMES_FIRST) + " " + pick(NAMES_LAST),  // + joins text: "Pip" + " " + "Puddle"
    kind: "clown",                               // every performer is a clown for now; other kinds are parked
    material: material,                          // the word passed in, e.g. "glass", which matches a MATERIALS key
    stamina: TUNE.baseCap,                       // arrives fully rested
    injuries: 0,
    mode: "rest",                                // starts off stage; the player sends them to Perform
    trick: 0,                                    // trick progress from 0 to 1; only moves in Perform
    xp: 0,
    level: 1,
  };
}

// ===== START: the starter clown, with a random material =====
game.performers.push(makePerformer(pick(Object.keys(MATERIALS))));  // Object.keys gives ["fabric","wood",...]; pick chooses one; push adds the clown
// ===== CARDS: build one card per performer and keep references to its changing parts =====
const troupeEl = document.getElementById("troupe");   // the empty middle; found once and kept, the same idea as the card references
const cards = {};                                     // card references filed by performer id, so cards[p.id] jumps straight to one (keyed, like MATERIALS)

function buildCard(p) {                               // p is one performer object from game.performers
  const el = document.createElement("div");           // the card's outer box, not on the page yet
  el.className = "card mat-" + p.material;            // "card mat-glass": the shared shape plus the material color from CSS
  // The card's insides, filled from p. Same ring markup as the test cards, but:
  //  - the two fill rings get an extra class ("trick", "xp") so they can be found below
  //  - both start at offset 100, meaning 0% done, because a new performer has no progress yet
  el.innerHTML = `
    <div class="name">${p.name}</div>
    <svg class="rings" viewBox="0 0 100 100">
      <circle class="track" cx="50" cy="50" r="46" stroke-width="4"/>
      <circle class="fill trick" cx="50" cy="50" r="46" stroke-width="4" pathLength="100" stroke-dashoffset="100"/>
      <circle class="track" cx="50" cy="50" r="37" stroke-width="6"/>
      <circle class="fill xp" cx="50" cy="50" r="37" stroke-width="6" pathLength="100" stroke-dashoffset="100"/>
      <circle class="icon" cx="50" cy="50" r="28"/>
    </svg>
    <div class="level">Lv 1</div>
  `;
  troupeEl.appendChild(el);                           // puts the finished card on the page, after any existing cards (hiring order)
  cards[p.id] = {                                     // the "direct lines": found once now, used every frame later
    el: el,                                           // the whole card, for things like a "resting" look later
    trick: el.querySelector(".trick"),                // outer ring; el.querySelector searches only inside this card, never another card's ring
    xp: el.querySelector(".xp"),                      // inner ring
    level: el.querySelector(".level"),                // level text, updated with textContent
  };
}
game.performers.forEach(buildCard);                   // forEach runs buildCard once for each performer in the array, in order                            // temporary check: open game.performers[0] in the console to see your clown

game.performers[0].mode = "perform"; 

const resourcesEl = document.getElementById("resources");
let last = performance.now();

// ===== UPDATE: the rules; changes only game, never the screen =====
function update(dt) {
  for (const p of game.performers) {             // for...of: each performer in hiring order; reads more plainly than forEach when there are skips
    if (p.mode !== "perform") continue;          // guard: resting performers don't move their trick (stamina refill joins here later)
    const mat = MATERIALS[p.material];           // this performer's material row; the lookup you practiced with brackets
    p.trick += dt / mat.repTime;                 // fraction of one trick done this frame: 0.016s ÷ 2.0s ≈ 0.008 for fabric
    if (p.trick >= 1) {                                              // the trick reached the end
      p.trick -= 1;
      p.xp += TUNE.xpPerTrick * mat.xp;          // every finished trick earns XP: 3 × the material's multiplier (wood gets 6, everyone else 3)                                                  // next lap, keeping the overshoot
      if (p.xp >= xpToNext(p.level)) {           // reached this level's cost
        p.xp -= xpToNext(p.level);               // pay it, keeping the leftover, just like trick −= 1
        p.level += 1;                            // level up; the next cost automatically doubles through xpToNext
      }
      if (Math.random() < mat.success) {                             // roll: e.g. fabric lands 60% of the time
        const perfect = mat.perfChance > 0 && Math.random() < mat.perfChance;  // glass only: the "> 0" check fails for rows with no perfChance (undefined), so they never roll
        const pay = TUNE.basePay * mat.pay * mat.crowd * (perfect ? 3 : 1);    // the pay formula; the ternary triples it on a Perfect
        game.coins += pay;                                           // into the purse; can be fractional (clay pays 2.6), which is fine in state
      }                                                              // no else: a fumble earns nothing, and the log will say so in a later piece
    }
  }
}

// ===== RENDER: the picture; reads game and changes only the screen =====
function render() {
  resourcesEl.textContent = "◉ " + Math.floor(game.coins);          // whole coins only: you never see a coin you can't spend yet
  for (const p of game.performers) {
    const c = cards[p.id];                       // this performer's kept references from buildCard
    c.trick.setAttribute("stroke-dashoffset", 100 - p.trick * 100);  // trick is 0–1, the ring wants 0–100: ×100, then offset = 100 − progress
    c.xp.setAttribute("stroke-dashoffset", 100 - (p.xp / xpToNext(p.level)) * 100);  // share of this level done, turned into a ring offset
    c.level.textContent = "Lv " + p.level;       // update the text under the rings
  }
}

// ===== GAME LOOP =====
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.25);  // seconds since last frame, capped
  last = now;
  update(dt);                                    // rules first...
  render();                                      // ...then draw the result, so the screen always shows this frame's state
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);