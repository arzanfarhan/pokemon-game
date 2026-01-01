/* game.js - simple turn-based Pokémon-like battle system
   - Contains data for Pokémon, items, and the battle loop
   - Updates UI (HP bars, names, message log)
   - Uses only vanilla JavaScript
*/

/* ---------- Data structures ---------- */

/* Define a simple Pokémon constructor/factory */
function createPokemon({ name, maxHp, img, moves, types }) {
  return {
    name,
    hp: maxHp,
    maxHp,
    img,
    moves, // array of { name, power, type }
    types: types || [],
    isFainted() { return this.hp <= 0; }
  };
}

/* Example moves */
const moves = {
  thunderShock: { name: "Thunder Shock", power: 18, type: "Electric" },
  quickAttack: { name: "Quick Attack", power: 10, type: "Normal" },
  tackle: { name: "Tackle", power: 12, type: "Normal" },
  vineWhip: { name: "Vine Whip", power: 16, type: "Grass" },
};

/* Example Pokémon */
const pikachu = createPokemon({
  name: "Pikachu",
  maxHp: 80,
  img: "https://via.placeholder.com/140x110?text=Pikachu",
  moves: [moves.thunderShock, moves.quickAttack],
  types: ["Electric"]
});

const bulbasaur = createPokemon({
  name: "Bulbasaur",
  maxHp: 90,
  img: "https://via.placeholder.com/140x110?text=Bulbasaur",
  moves: [moves.vineWhip, moves.tackle],
  types: ["Grass"]
});

/* Player party (for Switch button demo) */
const playerParty = [pikachu];

/* Wild enemy (starts as Bulbasaur) */
let enemyPokemon = createPokemon({
  name: "Wild Bulbasaur",
  maxHp: 70,
  img: "https://via.placeholder.com/140x110?text=Wild+Bulba",
  moves: [moves.vineWhip, moves.tackle],
  types: ["Grass"]
});

/* Player's active Pokémon (starting) */
let playerActive = playerParty[0];

/* Basic item inventory */
const items = {
  potion: { name: "Potion", heal: 20, count: 3 }
};

/* ---------- DOM elements ---------- */
const playerNameEl = document.getElementById("player-name");
const playerImgEl = document.getElementById("player-img");
const playerHpText = document.getElementById("player-hp-text");
const playerHpBar = document.getElementById("player-hp-bar");

const enemyNameEl = document.getElementById("enemy-name");
const enemyImgEl = document.getElementById("enemy-img");
const enemyHpText = document.getElementById("enemy-hp-text");
const enemyHpBar = document.getElementById("enemy-hp-bar");

const attackBtn = document.getElementById("attack-btn");
const itemBtn = document.getElementById("item-btn");
const catchBtn = document.getElementById("catch-btn");
const switchBtn = document.getElementById("switch-btn");

const movesPanel = document.getElementById("moves-panel");
const itemsPanel = document.getElementById("items-panel");

const messageLog = document.getElementById("message-log");
const clearLogBtn = document.getElementById("clear-log");

/* ---------- Utility & UI helpers ---------- */

function logMessage(text) {
  const d = document.createElement("div");
  d.className = "message";
  d.textContent = text;
  messageLog.appendChild(d);
  messageLog.scrollTop = messageLog.scrollHeight;
}

function updateHpBar(pokemon, hpBarEl, hpTextEl) {
  const pct = Math.max(0, Math.min(100, Math.round((pokemon.hp / pokemon.maxHp) * 100)));
  hpBarEl.style.width = pct + "%";
  // Color based on percent
  if (pct > 50) hpBarEl.style.background = "linear-gradient(90deg,#10b981,#60a5fa)"; // green-blue
  else if (pct > 20) hpBarEl.style.background = "linear-gradient(90deg,#f59e0b,#f97316)"; // orange
  else hpBarEl.style.background = "linear-gradient(90deg,#ef4444,#f43f5e)"; // red
  hpTextEl.textContent = `HP: ${Math.max(0, pokemon.hp)} / ${pokemon.maxHp}`;
}

function refreshUI() {
  playerNameEl.textContent = playerActive.name;
  playerImgEl.src = playerActive.img;
  enemyNameEl.textContent = enemyPokemon.name;
  enemyImgEl.src = enemyPokemon.img;
  updateHpBar(playerActive, playerHpBar, playerHpText);
  updateHpBar(enemyPokemon, enemyHpBar, enemyHpText);
}

/* Disable/enable all action buttons */
function setActionsEnabled(enabled) {
  attackBtn.disabled = !enabled;
  itemBtn.disabled = !enabled;
  catchBtn.disabled = !enabled;
  switchBtn.disabled = !enabled;
}

/* ---------- Game mechanics ---------- */

/* Apply damage from attacker move to target */
function applyMove(attacker, target, move) {
  // Simple damage calculation: base move power +/- small random variance
  const variance = Math.random() * 6 - 3; // -3 to +3
  const damage = Math.max(1, Math.round(move.power + variance));
  target.hp = Math.max(0, target.hp - damage);
  return damage;
}

/* Check for faint and handle */
function checkFaint(pokemon, who) {
  if (pokemon.hp <= 0) {
    logMessage(`${pokemon.name} fainted!`);
    setActionsEnabled(false);
    // If player's pokemon fainted -> end battle for this demo
    if (who === "player") {
      logMessage("You have no usable Pokémon. You blacked out...");
    } else {
      logMessage("You defeated the wild Pokémon!");
    }
    return true;
  }
  return false;
}

/* Enemy AI: randomly pick move and attack */
function enemyTurn() {
  if (enemyPokemon.isFainted() || playerActive.isFainted()) return;
  const choice = enemyPokemon.moves[Math.floor(Math.random() * enemyPokemon.moves.length)];
  const damage = applyMove(enemyPokemon, playerActive, choice);
  logMessage(`${enemyPokemon.name} used ${choice.name} and dealt ${damage} damage!`);
  refreshUI();
  const fainted = checkFaint(playerActive, "player");
  if (fainted) {
    // End: disable actions
    setActionsEnabled(false);
  } else {
    // Re-enable actions for player's next turn
    setActionsEnabled(true);
  }
}

/* Player attacks using selected move */
function playerAttack(move) {
  if (playerActive.isFainted() || enemyPokemon.isFainted()) return;
  setActionsEnabled(false);
  movesPanel.classList.add("hidden");

  const damage = applyMove(playerActive, enemyPokemon, move);
  logMessage(`Player used ${move.name}! It dealt ${damage} damage.`);
  refreshUI();

  const enemyFainted = checkFaint(enemyPokemon, "enemy");
  if (enemyFainted) {
    // battle ends
    setActionsEnabled(false);
    return;
  }

  // Enemy attacks back after a slight delay
  setTimeout(() => {
    enemyTurn();
  }, 700);
}

/* Attempt to catch the enemy (simple chance based on HP left) */
function attemptCatch() {
  if (enemyPokemon.isFainted()) {
    logMessage("There's nothing to catch.");
    return;
  }
  setActionsEnabled(false);
  // Basic catch formula: base chance increases as enemy HP decreases
  const hpFraction = enemyPokemon.hp / enemyPokemon.maxHp;
  const baseChance = 0.5; // 50% at very low HP
  const chance = Math.max(0.05, baseChance * (1 - hpFraction)); // min 5%
  const roll = Math.random();
  logMessage("You throw a Poké Ball...");
  setTimeout(() => {
    if (roll < chance) {
      logMessage(`Gotcha! ${enemyPokemon.name} was caught!`);
      // For demo: when caught, spawn a new random wild Pokémon after a moment
      setTimeout(spawnWildPokemon, 900);
    } else {
      logMessage(`${enemyPokemon.name} broke free!`);
      // Enemy gets a free attack
      setTimeout(() => {
        enemyTurn();
      }, 700);
    }
    setActionsEnabled(true);
  }, 900);
}

/* Use item (Potion) on player active Pokémon */
function useItem(itemKey) {
  const item = items[itemKey];
  if (!item || item.count <= 0) {
    logMessage("You don't have that item.");
    return;
  }
  if (playerActive.isFainted()) {
    logMessage("You can't use items on a fainted Pokémon in this demo.");
    return;
  }
  item.count -= 1;
  playerActive.hp = Math.min(playerActive.maxHp, playerActive.hp + item.heal);
  logMessage(`Used ${item.name} on ${playerActive.name}. Healed ${item.heal} HP.`);
  refreshUI();
  setActionsEnabled(false);
  // Enemy attacks after item use
  setTimeout(() => {
    enemyTurn();
  }, 700);
}

/* Switch Pokémon (simple: only one in party for now) */
function switchPokemon() {
  logMessage("You don't have other Pokémon to switch to in this demo.");
}

/* Spawn a new wild Pokémon (random selection for demo) */
function spawnWildPokemon() {
  // Simple toggle between Bulbasaur and a new Pikachu for variety
  const choice = Math.random() < 0.5 ? createPokemon({
    name: "Wild Bulbasaur",
    maxHp: 70,
    img: "https://via.placeholder.com/140x110?text=Wild+Bulba",
    moves: [moves.vineWhip, moves.tackle]
  }) : createPokemon({
    name: "Wild Pikachu",
    maxHp: 60,
    img: "https://via.placeholder.com/140x110?text=Wild+Pika",
    moves: [moves.thunderShock, moves.quickAttack]
  });

  enemyPokemon = choice;
  logMessage(`A wild ${enemyPokemon.name} appeared!`);
  refreshUI();
  setActionsEnabled(true);
}

/* ---------- UI event wiring ---------- */

attackBtn.addEventListener("click", () => {
  // Build moves panel for player's active Pokémon
  movesPanel.innerHTML = "";
  playerActive.moves.forEach((m, idx) => {
    const b = document.createElement("button");
    b.textContent = `${m.name} (Power ${m.power})`;
    b.onclick = () => playerAttack(m);
    movesPanel.appendChild(b);
  });
  // Close button
  const close = document.createElement("button");
  close.textContent = "Close";
  close.onclick = () => {
    movesPanel.classList.add("hidden");
  };
  movesPanel.appendChild(close);
  movesPanel.classList.remove("hidden");
});

itemBtn.addEventListener("click", () => {
  itemsPanel.classList.toggle("hidden");
});

document.querySelectorAll(".items-panel .item, .items-panel .item").forEach(() => {}); // noop to satisfy some linters

// Wire up specific item buttons
itemsPanel.addEventListener("click", (e) => {
  const target = e.target;
  if (!target.classList.contains("item")) return;
  const key = target.dataset && target.dataset.item;
  if (key === "potion") {
    useItem("potion");
  } else if (target.id === "close-items") {
    itemsPanel.classList.add("hidden");
  }
});

catchBtn.addEventListener("click", () => {
  attemptCatch();
});

switchBtn.addEventListener("click", () => {
  switchPokemon();
});

clearLogBtn.addEventListener("click", () => {
  messageLog.innerHTML = "";
});

/* Prevent user from clicking other actions while moves panel open */
movesPanel.addEventListener("click", (e) => {
  // clicks are handled via the buttons created above
});

/* ---------- Initialize & start ---------- */
function init() {
  logMessage("Battle started!");
  refreshUI();
  setActionsEnabled(true);
  logMessage(`A wild ${enemyPokemon.name} appeared!`);
}

init();

/* Expose a couple things for debugging in console (optional) */
window._battle = {
  playerActive, enemyPokemon, spawnWildPokemon, items
};
