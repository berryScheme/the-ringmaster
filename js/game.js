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

const mat = "glass";
console.log(MATERIALS[mat].perfChance);
