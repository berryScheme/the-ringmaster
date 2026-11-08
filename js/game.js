// ===== TUNING: every balance number in one place, so tweaking the game means editing only this list =====
const TUNE = {                // const: TUNE is never replaced, only read (and maybe edited by hand while tuning)
  baseCap: 100,               // stamina cap of an uninjured performer
  trickCost: 18,              // stamina spent per finished trick, drained gradually across the trick
  restRate: 8,                // stamina regained per second while resting
  injuryCapLoss: 20,          // cap lost per injury
  minCap: 20,                 // injuries can never push the cap below this
  basePay: 2,                 // coins per successful trick, before the material multipliers
  xpPerTrick: 3,              // XP per finished trick, before the material's XP multiplier
  scavTime: 3,                // seconds one scavenge takes
  scavMaterialChance: 0.8,    // decimal chance a scavenge finds a material (otherwise 3 coins); compared directly against Math.random()
  baseCost: 15,               // price of the first hire
  costGrowth: 1.5,            // each later hire costs 1.5 times the previous one
};

// ===== MATERIALS: one row per material, filed by name so MATERIALS[performer.material] finds it directly =====
const MATERIALS = {
  fabric: { repTime: 2.0, success: 0.60, pay: 1.0, crowd: 1.0, xp: 1 },  // quick reps
  wood:   { repTime: 2.5, success: 0.60, pay: 1.0, crowd: 1.0, xp: 2 },  // learns twice as fast
  clay:   { repTime: 2.5, success: 0.50, pay: 1.0, crowd: 1.3, xp: 1 },  // bigger crowd, shakier hands
  metal:  { repTime: 3.5, success: 0.60, pay: 1.5, crowd: 1.0, xp: 1 },  // pays more, works slower
  glass:  { repTime: 2.5, success: 0.55, pay: 1.0, crowd: 1.0, xp: 1 , perfChance: 0.1},  // its special Perfect rule comes next (your turn)
};

console.log("Game data loaded:", TUNE, MATERIALS);  // temporary check: prints both tables to the console; delete once confirmed

// ===== NAME PARTS: a random first + last gives each performer a name =====
const NAMES_FIRST = ["Pip", "Bo", "Tilly", "Mungo", "Dot", "Fizz"];        // arrays, because we pick by random position
const NAMES_LAST  = ["Magnifico", "Puddle", "Stitchwick", "Bramble", "Tumble", "Ploof"];

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
  };
}

// ===== START: the starter clown, with a random material =====
game.performers.push(makePerformer(pick(Object.keys(MATERIALS))));  // Object.keys gives ["fabric","wood",...]; pick chooses one; push adds the clown
console.log(game);                               // temporary check: open game.performers[0] in the console to see your clown

game.performers.push(makePerformer(pick(Object.keys("metal"))));

console.log(game.performers[1].name);