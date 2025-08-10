import { Game } from "./modules/game.js";
import { levels } from "./modules/levels.js";

const canvas = document.getElementById("game");
const hud = {
  inkBar: document.getElementById("inkBar"),
  inkFill: document.getElementById("inkFill"),
  inkText: document.getElementById("inkText"),
  savedText: document.getElementById("savedText"),
  remainingText: document.getElementById("remainingText"),
  levelText: document.getElementById("levelText"),
  timeText: document.getElementById("timeText"),
  btnReset: document.getElementById("btnReset"),
  btnNext: document.getElementById("btnNext"),
  btnPause: document.getElementById("btnPause"),
  speedSlider: document.getElementById("speedSlider"),
  speedText: document.getElementById("speedText"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlaySubtitle: document.getElementById("overlaySubtitle"),
  overlayScore: document.getElementById("overlayScore"),
  overlayTime: document.getElementById("overlayTime"),
  ovlRestart: document.getElementById("ovlRestart"),
  ovlNext: document.getElementById("ovlNext"),
  ovlLevelSelect: document.getElementById("ovlLevelSelect"),
  // Start panel
  startPanel: document.getElementById("startPanel"),
  startSpeed: document.getElementById("startSpeed"),
  startSpeedText: document.getElementById("startSpeedText"),
  optAutoJump: document.getElementById("optAutoJump"),
  optLockSpeed: document.getElementById("optLockSpeed"),
  btnStartRun: document.getElementById("btnStartRun"),
  // Level select
  levelSelect: document.getElementById("levelSelect"),
  levelList: document.getElementById("levelList"),
  btnCloseLevelSelect: document.getElementById("btnCloseLevelSelect"),
};

const game = new Game(canvas, hud, levels);
game.start();

// Controls
hud.btnReset.addEventListener("click", () => game.resetLevel());
hud.btnNext.addEventListener("click", () => game.nextLevel());
hud.btnPause.addEventListener("click", () => game.togglePause());

hud.ovlRestart.addEventListener("click", () => {
  hud.overlay.style.display = "none";
  game.resetLevel();
});
hud.ovlNext.addEventListener("click", () => {
  hud.overlay.style.display = "none";
  game.nextLevel();
});
hud.ovlLevelSelect.addEventListener("click", () => {
  hud.overlay.style.display = "none";
  game.openLevelSelect();
});

// Speed control
hud.speedSlider.addEventListener("input", () => {
  const v = parseFloat(hud.speedSlider.value);
  hud.speedText.textContent = `${v.toFixed(2)}x`;
  game.setTimeScale(v);
});

// Start panel controls
hud.startSpeed.addEventListener("input", () => {
  const v = parseFloat(hud.startSpeed.value);
  hud.startSpeedText.textContent = `${v.toFixed(2)}x`;
});
hud.btnStartRun.addEventListener("click", () => {
  const speed = parseFloat(hud.startSpeed.value);
  const autoJump = !!hud.optAutoJump.checked;
  const lockSpeed = !!hud.optLockSpeed.checked;
  hud.startPanel.style.display = "none";
  // sync HUD slider value/label with start selection
  hud.speedSlider.value = String(speed);
  hud.speedText.textContent = `${speed.toFixed(2)}x`;
  game.beginRun({ speed, autoJump, lockSpeed });
  // persist last settings for next level selection
  game.lastSettings = { speed, autoJump, lockSpeed };
});

// Level select
hud.btnCloseLevelSelect.addEventListener("click", () => {
  hud.levelSelect.style.display = "none";
});

window.addEventListener("resize", () => game.resize());

// Shortcuts
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") game.resetLevel();
  if (e.key.toLowerCase() === "n") game.nextLevel();
  if (e.key === " ") game.togglePause();
});

// Double-click anywhere to validate score after 2s window
window.addEventListener("dblclick", () => {
  game.requestValidation(2000);
});
