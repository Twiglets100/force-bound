// ForceBound: Chronicles of Resonance - Main Game Manager
window.ForceBound = window.ForceBound || {};

// Global compatibility variables
var playerTeam = [];
var resonatorName = "Resonator-01";
var overworld = null;
var battleEngine = null;
var siphonSystem = null;

// Dialogue state
window.dialogueActive = false;
let dialogueLines = [];
let dialogueIndex = 0;
let dialogueSpeaker = "";
let dialogueCallback = null;

const Sound = ForceBound.Sound;
const SaveSystem = ForceBound.SaveSystem;
const SVGGenerator = ForceBound.SVGGenerator;

// --- Dialogue functions ---
function startDialogue(speaker, lines, callback = null) {
    window.dialogueActive = true;
    dialogueSpeaker = speaker;
    dialogueLines = lines;
    dialogueIndex = 0;
    dialogueCallback = callback;
    
    document.getElementById('dialogue-box').style.display = 'flex';
    document.getElementById('dialogue-speaker').innerText = speaker;
    
    renderDialogueLine();
}

function renderDialogueLine() {
    const textDiv = document.getElementById('dialogue-text');
    const line = dialogueLines[dialogueIndex];
    
    textDiv.innerHTML = "";
    let charIdx = 0;
    
    if (window.dialogueInterval) clearInterval(window.dialogueInterval);
    
    window.dialogueInterval = setInterval(() => {
        if (charIdx < line.length) {
            textDiv.innerHTML += line[charIdx];
            charIdx++;
        } else {
            clearInterval(window.dialogueInterval);
            window.dialogueInterval = null;
        }
    }, 12);
}

function advanceDialogue() {
    if (window.dialogueInterval) {
        clearInterval(window.dialogueInterval);
        window.dialogueInterval = null;
        document.getElementById('dialogue-text').innerText = dialogueLines[dialogueIndex];
        return;
    }
    
    dialogueIndex++;
    if (dialogueIndex < dialogueLines.length) {
        renderDialogueLine();
    } else {
        closeDialogue();
    }
}

function closeDialogue() {
    window.dialogueActive = false;
    document.getElementById('dialogue-box').style.display = 'none';
    if (dialogueCallback) {
        dialogueCallback();
    }
    if (overworld) overworld.draw();
}

function saveStoryState() {
    const state = SaveSystem.load();
    if (state) {
        state.storyState = window.storyState;
        state.takenPodX = window.takenPodX;
        SaveSystem.save(state);
    }
}

function initializeNPCs() {
    const townMap = MAPS['town'];
    if (window.storyState === 'WOKE_UP' || window.storyState === 'TALKED_MOM') {
        townMap.npcs['12,1'] = { id: 'guard', name: 'Kyle', sprite: 'guard', dialog: 'guard' };
    } else {
        // Shift guard aside to let player pass to Route 1
        delete townMap.npcs['12,1'];
        townMap.npcs['13,1'] = { id: 'guard', name: 'Kyle', sprite: 'guard', dialog: 'guard' };
    }
}

function triggerNPCDialogue(npcId) {
    Sound.playClick();
    
    if (npcId === 'mom') {
        if (window.storyState === 'WOKE_UP') {
            startDialogue('M-0T', DIALOGUE_DATABASE.mom.woke_up, () => {
                window.storyState = 'TALKED_MOM';
                saveStoryState();
            });
        } else {
            startDialogue('M-0T', DIALOGUE_DATABASE.mom.general, () => {
                playerTeam.forEach(member => {
                    member.currentStability = member.maxStability;
                    member.currentEnergy = 50;
                });
                Sound.playConfirm();
                saveStoryState();
            });
        }
    }
    else if (npcId === 'guard') {
        if (window.storyState === 'WOKE_UP' || window.storyState === 'TALKED_MOM') {
            startDialogue('Kyle', DIALOGUE_DATABASE.guard.block);
        } else {
            startDialogue('Kyle', DIALOGUE_DATABASE.guard.allow);
        }
    }
    else if (npcId === 'aris') {
        if (playerTeam.length === 0) {
            startDialogue('Dr. Aris', DIALOGUE_DATABASE.professor.need_starter);
        } else if (window.storyState === 'NODE_STABILIZED') {
            startDialogue('Dr. Aris', DIALOGUE_DATABASE.professor.mission_complete, () => {
                showVictoryScreen();
            });
        } else {
            startDialogue('Dr. Aris', DIALOGUE_DATABASE.professor.after_starter);
        }
    }
    else if (npcId === 'scientist') {
        startDialogue('Bob', DIALOGUE_DATABASE.scientist.info);
    }
    else if (npcId === 'node') {
        if (window.storyState === 'NODE_STABILIZED') {
            startDialogue('Resonance Node', DIALOGUE_DATABASE.node.stable);
        } else {
            startDialogue('Resonance Node', DIALOGUE_DATABASE.node.stabilize, () => {
                launchNodeStabilization();
            });
        }
    }
}

function interactWithPC() {
    Sound.playClick();
    startDialogue('PC TERMINAL', [
        "PC Telemetry Log #01: Chrono-Stabilizer initialized at Vector Station.",
        "PC Telemetry Log #02: Field fluctuations detected in Northern Outlands.",
        "PC Telemetry Log #03: Danger warning: Node collapse imminent. Sync parameters required."
    ]);
}

function interactWithPod(x) {
    if (playerTeam.length > 0) {
        startDialogue('SYSTEM', ["PC Counter: All selection modules are locked to prevent quantum feedback loop interference."]);
        return;
    }
    
    let species = '';
    if (x === 4) species = 'graviton';
    else if (x === 6) species = 'electron';
    else if (x === 8) species = 'entropist';
    
    const spec = FORCE_SPECIES[species];
    startDialogue('SYSTEM', [
        `Pod contains a stabilized ${spec.species} field anomaly (Type: ${spec.primaryType}).`,
        `Align Resonance Siphon with this creature?`,
        `[SPACE] to confirm alignment, [ENTER] to cancel.`
    ], () => {
        confirmStarterChoice(species, x);
    });
}

function confirmStarterChoice(species, x) {
    const spec = FORCE_SPECIES[species];
    startDialogue('SYSTEM', [
        `Synchronizing frequencies with ${spec.species}...`,
        `Resonance lock established! ${spec.species} bound to team.`,
        `Dr. Aris: Wonderful choice! That creature has massive potential.`
    ], () => {
        const starterForce = {
            species: spec.species,
            key: species,
            type: spec.primaryType,
            nickname: spec.species,
            level: 5,
            xp: 0,
            maxStability: spec.baseStats.maxStability + 5 * 4,
            currentStability: spec.baseStats.maxStability + 5 * 4,
            currentEnergy: 50,
            phaseState: 'Solid',
            stats: {
                attack: spec.baseStats.attack + 5 * 2,
                defense: spec.baseStats.defense + 5 * 2,
                speed: spec.baseStats.speed + 5 * 1
            },
            moves: [...spec.startingMoves]
        };
        
        playerTeam = [starterForce];
        window.playerTeam = playerTeam; // sync
        window.storyState = 'HAS_STARTER';
        window.takenPodX = x;
        
        initializeNPCs();
        
        const state = SaveSystem.load();
        if (state) {
            state.team = playerTeam;
            state.storyState = 'HAS_STARTER';
            state.takenPodX = x;
            state.discovered = state.discovered || {};
            state.discovered[species] = 'captured';
            SaveSystem.save(state);
        }
        
        if (overworld) {
            overworld.grid = MAPS[overworld.currentMap].generate();
            overworld.draw();
        }
    });
}

function launchNodeStabilization() {
    if (overworld) overworld.stop();
    const overlay = document.getElementById('siphon-overlay');
    overlay.classList.add('active');
    
    siphonSystem.start({
        canvas: '#oscilloscope-canvas',
        wavelengthSlider: document.getElementById('slider-wavelength'),
        amplitudeSlider: document.getElementById('slider-amplitude'),
        duration: 8000,
        onComplete: (accuracy) => {
            overlay.classList.remove('active');
            if (overworld) overworld.start();
            if (accuracy >= 0.90) {
                Sound.playConfirm();
                window.storyState = 'NODE_STABILIZED';
                saveStoryState();
                startDialogue('SYSTEM', [
                    "Resonance Node status: HARMONIC LOCK ENGAGED.",
                    "Spacetime integrity stabilized to 100%.",
                    "Return to Dr. Aris at Vector Station Lab."
                ]);
            } else {
                Sound.playHit();
                startDialogue('SYSTEM', [
                    "Harmonic coupling failed.",
                    "Frequency alignment unstable. Try again."
                ]);
            }
        }
    });

    const wSlider = document.getElementById('slider-wavelength');
    const aSlider = document.getElementById('slider-amplitude');
    const wVal = document.getElementById('val-wavelength');
    const aVal = document.getElementById('val-amplitude');
    
    wVal.innerText = wSlider.value;
    aVal.innerText = aSlider.value;
    
    wSlider.oninput = () => wVal.innerText = wSlider.value;
    aSlider.oninput = () => aVal.innerText = aSlider.value;
    
    document.getElementById('btn-siphon-confirm').onclick = () => {
        siphonSystem.triggerCapture();
    };
    
    document.getElementById('btn-siphon-abort').onclick = () => {
        siphonSystem.stop();
        overlay.classList.remove('active');
        if (overworld) overworld.start();
    };
}

function showVictoryScreen() {
    if (overworld) overworld.stop();
    alert("VICTORY! You stabilized Sector Alpha.\nResonance integrity: 100%.\nResetting simulation metrics...");
    SaveSystem.delete();
    window.location.reload();
}

function loadGameData() {
    const state = SaveSystem.load();
    if (state) {
        initGame(state);
    }
}

function initGame(state) {
    resonatorName = state.resonatorName || "Resonator-01";
    playerTeam = state.team || [];
    window.playerTeam = playerTeam; // sync
    window.storyState = state.storyState || 'WOKE_UP';
    window.takenPodX = state.takenPodX !== undefined ? state.takenPodX : -1;
    
    initializeNPCs();
    
    let alignment = 'none';
    if (playerTeam.some(f => f.type === 'Electromagnetism')) {
        alignment = 'electromagnetism';
    }
    if (playerTeam.some(f => f.type === 'Resonance')) {
        alignment = 'resonance';
    }
    
    const mapId = state.activeMap || 'home';
    const canvas = document.getElementById('overworld-canvas');
    
    overworld = new ForceBound.OverworldEngine(canvas, {
        activeMap: mapId,
        player: {
            x: state.position.x !== undefined ? state.position.x : 4,
            y: state.position.y !== undefined ? state.position.y : 4,
            direction: 'down',
            alignment: alignment
        },
        onStep: (x, y) => {
            document.getElementById('hud-coords').innerText = `${x.toString().padStart(2,'0')},${y.toString().padStart(2,'0')}`;
            savePosition(x, y);
        },
        onEncounter: (x, y) => {
            triggerEncounter();
        }
    });
    window.overworld = overworld; // sync
    
    battleEngine = new ForceBound.BattleEngine({
        movesDatabase: MOVES,
        onLog: (msg) => {
            const consoleBox = document.getElementById('battle-console');
            const logLine = document.createElement('div');
            logLine.innerText = `[LOG] ${msg}`;
            consoleBox.appendChild(logLine);
            consoleBox.scrollTop = consoleBox.scrollHeight;
        },
        onStateChange: (state) => {
            updateBattleUI(state);
        },
        onVfx: ({ type, isPlayer }) => {
            const vfxClasses = {
                'Gravity': 'vfx-gravity-shake',
                'Electromagnetism': 'vfx-em-glitch',
                'Entropy': 'vfx-entropy-decay',
                'Resonance': 'vfx-resonance-ripple'
            };
            const cls = vfxClasses[type];
            if (cls) {
                const body = document.getElementById('game-body');
                body.classList.add(cls);
                setTimeout(() => {
                    body.classList.remove(cls);
                }, 600);
            }
            if (type === 'Gravity') {
                Sound.playGlitch();
            } else if (type === 'Electromagnetism') {
                Sound.playHit();
            } else if (type === 'Entropy') {
                Sound.playClick();
            } else {
                Sound.playConfirm();
            }
        }
    });
    window.battleEngine = battleEngine; // sync
    
    siphonSystem = new ForceBound.SiphonSystem();
    window.siphonSystem = siphonSystem; // sync
    
    setupUIListeners();
    showScreen('screen-overworld');
    
    const sectorNames = {
        home: "RESONATOR QUARTERS",
        town: "VECTOR STATION ALPHA",
        lab: "RESONANCE LAB",
        route1: "ROUTE 1 - THE OUTLANDS"
    };
    document.getElementById('hud-sector').innerText = `SECTOR: ${sectorNames[mapId] || 'UNKNOWN'}`;
    
    overworld.start();
    Sound.playConfirm();
    
    // Initial greeting dialog
    if (window.storyState === 'WOKE_UP' && mapId === 'home') {
        setTimeout(() => {
            triggerNPCDialogue('mom');
        }, 600);
    }
}

function savePosition(x, y) {
    const state = SaveSystem.load();
    if (state) {
        state.position.x = x;
        state.position.y = y;
        state.activeMap = overworld.currentMap;
        let alignment = 'none';
        if (playerTeam.some(f => f.type === 'Electromagnetism')) {
            alignment = 'electromagnetism';
        }
        if (playerTeam.some(f => f.type === 'Resonance')) {
            alignment = 'resonance';
        }
        state.alignment = alignment;
        overworld.player.alignment = alignment;
        SaveSystem.save(state);
    }
}

function getPhaseStateForLevel(speciesKey, level) {
    const spec = FORCE_SPECIES[speciesKey];
    if (!spec) return 'Solid';
    let currentState = 'Solid';
    for (const phase of spec.phaseStates) {
        if (level >= phase.threshold) {
            currentState = phase.state;
        }
    }
    return currentState;
}

function triggerEncounter() {
    overworld.stop();
    Sound.playGlitch();
    
    document.getElementById('game-body').classList.add('glitch-active');
    setTimeout(() => {
        document.getElementById('game-body').classList.remove('glitch-active');
        
        const wildPool = ['photon', 'tachyon', 'quark', 'electron', 'graviton', 'entropist'];
        const wildKey = wildPool[Math.floor(Math.random() * wildPool.length)];
        const wildSpec = FORCE_SPECIES[wildKey];
        
        const playerLvl = playerTeam.length > 0 ? playerTeam[0].level : 5;
        const wildLvl = Math.max(1, playerLvl + Math.floor(Math.random() * 3) - 1);
        
        const wildForce = {
            species: wildSpec.species,
            key: wildKey,
            type: wildSpec.primaryType,
            nickname: "Wild " + wildSpec.species,
            level: wildLvl,
            xp: 0,
            maxStability: wildSpec.baseStats.maxStability + wildLvl * 4,
            currentStability: wildSpec.baseStats.maxStability + wildLvl * 4,
            currentEnergy: 50,
            phaseState: getPhaseStateForLevel(wildKey, wildLvl),
            stats: {
                attack: wildSpec.baseStats.attack + wildLvl * 2,
                defense: wildSpec.baseStats.defense + wildLvl * 2,
                speed: wildSpec.baseStats.speed + wildLvl * 1
            },
            moves: [...wildSpec.startingMoves]
        };
        
        updateDexRecord(wildKey, 'seen');
        document.getElementById('battle-console').innerHTML = '';
        showScreen('screen-battle');
        const firstHealthy = playerTeam.find(f => f.currentStability > 0) || playerTeam[0];
        battleEngine.startBattle(firstHealthy, wildForce, playerTeam);
    }, 450);
}

function updateDexRecord(key, status) {
    const state = SaveSystem.load();
    if (state) {
        state.discovered = state.discovered || {};
        if (state.discovered[key] !== 'captured') {
            state.discovered[key] = status;
            SaveSystem.save(state);
        }
    }
}

function updateBattleUI(battleState) {
    const pf = battleEngine.playerForce;
    const ef = battleEngine.opponentForce;
    
    if (!pf || !ef) return;
    
    // Player HUD
    document.getElementById('player-name').innerText = pf.nickname;
    document.getElementById('player-level').innerText = `LV.${pf.level}`;
    const pStabilityPct = Math.ceil((pf.currentStability / pf.maxStability) * 100);
    document.getElementById('player-stability-val').innerText = `${pStabilityPct}%`;
    const pBar = document.getElementById('player-stability-fill');
    pBar.style.width = `${pStabilityPct}%`;
    pBar.className = 'stability-bar-fill';
    if (pStabilityPct < 20) pBar.classList.add('critical');
    else if (pStabilityPct < 50) pBar.classList.add('warning');
    
    const pEnergyVal = pf.currentEnergy !== undefined ? pf.currentEnergy : 50;
    document.getElementById('player-energy-val').innerText = `${pEnergyVal}/50`;
    const pEnergyBar = document.getElementById('player-energy-fill');
    if (pEnergyBar) {
        pEnergyBar.style.width = `${(pEnergyVal / 50) * 100}%`;
    }
    
    document.getElementById('player-state-badge').innerText = pf.phaseState;
    
    // Handle SVG state customization
    let pSvgState = battleEngine.playerSvgState || 'idle';
    if (battleEngine.playerSvgState === undefined) {
        pSvgState = (battleState === 'ORDERING' || battleState === 'EXECUTION') ? 'attacking' : 'idle';
    }
    document.getElementById('player-svg-container').innerHTML = SVGGenerator.generate(pf.key || pf.species, pf.phaseState, pSvgState);
    
    // Enemy HUD
    document.getElementById('enemy-name').innerText = ef.nickname;
    document.getElementById('enemy-level').innerText = `LV.${ef.level}`;
    const eStabilityPct = Math.ceil((ef.currentStability / ef.maxStability) * 100);
    document.getElementById('enemy-stability-val').innerText = `${eStabilityPct}%`;
    const eBar = document.getElementById('enemy-stability-fill');
    eBar.style.width = `${eStabilityPct}%`;
    eBar.className = 'stability-bar-fill';
    if (eStabilityPct < 20) eBar.className = 'stability-bar-fill critical';
    else if (eStabilityPct < 50) eBar.className = 'stability-bar-fill warning';
    
    const eEnergyVal = ef.currentEnergy !== undefined ? ef.currentEnergy : 50;
    document.getElementById('enemy-energy-val').innerText = `${eEnergyVal}/50`;
    const eEnergyBar = document.getElementById('enemy-energy-fill');
    if (eEnergyBar) {
        eEnergyBar.style.width = `${(eEnergyVal / 50) * 100}%`;
    }
    
    document.getElementById('enemy-state-badge').innerText = ef.phaseState;
    
    // Handle SVG state customization
    let eSvgState = battleEngine.enemySvgState || 'idle';
    if (battleEngine.enemySvgState === undefined) {
        eSvgState = (battleState === 'ORDERING' || battleState === 'EXECUTION') ? 'attacking' : 'idle';
    }
    document.getElementById('enemy-svg-container').innerHTML = SVGGenerator.generate(ef.key || ef.species, ef.phaseState, eSvgState);
    
    // Controls Visibility
    if (battleState === 'SELECTION') {
        enableControls(true);
        populateMoveButtons();
    } else if (battleState === 'SWAP_PROMPT') {
        enableControls(false);
        openSwapMenu(true); 
    } else {
        enableControls(false);
    }
    
    if (battleState === 'FINISHED') {
        resolveBattleEnd();
    }
}

function populateMoveButtons() {
    const pf = battleEngine.playerForce;
    for (let i = 0; i < 4; i++) {
        const btn = document.querySelector(`.move-btn[data-slot="${i}"]`);
        if (i < pf.moves.length) {
            const mKey = pf.moves[i];
            const m = MOVES[mKey] || { name: mKey, type: 'Gravity', power: 40, energyCost: 5 };
            btn.querySelector('.move-name').innerText = m.name;
            btn.querySelector('.move-meta').innerText = `ENERGY: ${m.energyCost} | TYPE: ${m.type.toUpperCase()}`;
            btn.disabled = false;
            btn.dataset.moveKey = mKey;
        } else {
            btn.querySelector('.move-name').innerText = '---';
            btn.querySelector('.move-meta').innerText = 'ENERGY: -';
            btn.disabled = true;
            delete btn.dataset.moveKey;
        }
    }
}

function enableControls(enable) {
    document.querySelectorAll('.move-btn').forEach(btn => btn.disabled = !enable);
    document.getElementById('btn-battle-siphon').disabled = !enable;
    document.getElementById('btn-battle-swap').disabled = !enable;
    document.getElementById('btn-battle-flee').disabled = !enable;
}

function setupUIListeners() {
    document.querySelectorAll('.move-btn').forEach(btn => {
        // Prevent duplicate listener additions if loaded multiple times
        btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.move-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mKey = btn.dataset.moveKey;
            if (mKey && battleEngine.state === 'SELECTION') {
                const move = MOVES[mKey];
                Sound.playHit();
                battleEngine.selectAction({ type: 'attack', move: move });
            }
        });

        btn.addEventListener('mouseenter', () => {
            const mKey = btn.dataset.moveKey;
            const analyzer = document.getElementById('analyzer-box');
            if (mKey && analyzer) {
                const m = MOVES[mKey];
                if (m) {
                    const typeColors = {
                        'gravity': 'var(--color-gravity)',
                        'electromagnetism': 'var(--color-em)',
                        'entropy': 'var(--color-entropy)',
                        'resonance': 'var(--color-resonance)'
                    };
                    const colorVal = typeColors[m.type.toLowerCase()] || 'var(--color-em)';
                    analyzer.classList.add('active-scan');
                    analyzer.innerHTML = `
                        <strong style="color: var(--color-em);">${m.name.toUpperCase()}</strong> | 
                        TYPE: <span style="color: ${colorVal};">${m.type.toUpperCase()}</span> | 
                        POWER: <span style="color: #fff;">${m.power || 0}</span> | 
                        COST: <span style="color: #fff;">${m.energyCost || 0}</span> Energy
                        <br>
                        <span style="color: #c0d0e0; font-size: 0.8rem;">${m.description || ''}</span>
                    `;
                }
            }
        });

        btn.addEventListener('mouseleave', () => {
            const analyzer = document.getElementById('analyzer-box');
            if (analyzer) {
                analyzer.classList.remove('active-scan');
                analyzer.innerText = "Hover over a move slot to engage field telemetry scanner...";
            }
        });
    });
    
    const siphonBtn = document.getElementById('btn-battle-siphon');
    siphonBtn.replaceWith(siphonBtn.cloneNode(true));
    document.getElementById('btn-battle-siphon').addEventListener('click', () => {
        if (battleEngine.state === 'SELECTION') {
            battleEngine.selectAction({ type: 'siphon' });
            launchSiphonGame();
        }
    });
    
    const swapCloseBtn = document.getElementById('btn-swap-close');
    swapCloseBtn.replaceWith(swapCloseBtn.cloneNode(true));
    document.getElementById('btn-swap-close').addEventListener('click', () => {
        document.getElementById('swap-overlay').style.display = 'none';
        Sound.playClick();
    });
    
    const swapBtn = document.getElementById('btn-battle-swap');
    swapBtn.replaceWith(swapBtn.cloneNode(true));
    document.getElementById('btn-battle-swap').addEventListener('click', () => {
        openSwapMenu(false);
    });
    
    const fleeBtn = document.getElementById('btn-battle-flee');
    fleeBtn.replaceWith(fleeBtn.cloneNode(true));
    document.getElementById('btn-battle-flee').addEventListener('click', () => {
        if (battleEngine.state === 'SELECTION') {
            battleEngine.selectAction({ type: 'flee' });
        }
    });
    
    const saveBtn = document.getElementById('btn-save-game');
    saveBtn.replaceWith(saveBtn.cloneNode(true));
    document.getElementById('btn-save-game').addEventListener('click', () => {
        const state = SaveSystem.load();
        if (state) {
            state.team = playerTeam;
            state.storyState = window.storyState;
            state.takenPodX = window.takenPodX;
            SaveSystem.save(state);
            alert("Spacetime coordinates & Quest progress saved successfully!");
            Sound.playConfirm();
        }
    });
    
    const openDexBtn = document.getElementById('btn-open-dex');
    openDexBtn.replaceWith(openDexBtn.cloneNode(true));
    document.getElementById('btn-open-dex').addEventListener('click', () => {
        overworld.stop();
        openForceDex();
    });
    
    const closeDexBtn = document.getElementById('btn-close-dex');
    closeDexBtn.replaceWith(closeDexBtn.cloneNode(true));
    document.getElementById('btn-close-dex').addEventListener('click', () => {
        showScreen('screen-overworld');
        overworld.start();
        Sound.playClick();
    });

    const openTeamBtn = document.getElementById('btn-open-team');
    if (openTeamBtn) {
        openTeamBtn.replaceWith(openTeamBtn.cloneNode(true));
        document.getElementById('btn-open-team').addEventListener('click', () => {
            overworld.stop();
            openTeamConfig();
        });
    }

    const closeTeamBtn = document.getElementById('btn-close-team');
    if (closeTeamBtn) {
        closeTeamBtn.replaceWith(closeTeamBtn.cloneNode(true));
        document.getElementById('btn-close-team').addEventListener('click', () => {
            showScreen('screen-overworld');
            overworld.start();
            Sound.playClick();
        });
    }

    const dismissBtn = document.getElementById('btn-dismiss-spectrum');
    dismissBtn.replaceWith(dismissBtn.cloneNode(true));
    document.getElementById('btn-dismiss-spectrum').addEventListener('click', () => {
        const res = battleEngine.result;
        
        // Hide end control panel, restore active controls grid
        document.getElementById('battle-end-controls').style.display = 'none';
        document.querySelector('.moves-grid').style.display = 'grid';
        document.querySelector('.tactical-grid').style.display = 'grid';
        
        if (res === 'defeat') {
            // Force recovery at quarters (M-0T home healing)
            playerTeam.forEach(member => {
                member.currentStability = member.maxStability;
                member.currentEnergy = 50;
            });
            
            showScreen('screen-overworld');
            overworld.warpToMap('home', 4, 4);
            
            const curState = SaveSystem.load();
            if (curState) {
                curState.team = playerTeam;
                curState.activeMap = 'home';
                curState.position = { x: 4, y: 4 };
                SaveSystem.save(curState);
            }
            
            setTimeout(() => {
                startDialogue('M-0T', [
                    "M-0T: Emergency teleport initiated. Active Resonator stability collapsed.",
                    "M-0T: Frequencies successfully restored to 100%. Fields stable.",
                    "M-0T: Please exercise extreme caution in volatile sectors."
                ]);
            }, 600);
        } else {
            showScreen('screen-overworld');
            overworld.start();
        }
    });
}

function openSwapMenu(faintedSwap = false) {
    const overlay = document.getElementById('swap-overlay');
    const list = document.getElementById('swap-list');
    list.innerHTML = '';
    
    document.getElementById('btn-swap-close').style.display = faintedSwap ? 'none' : 'block';

    playerTeam.forEach((member, idx) => {
        const btn = document.createElement('button');
        btn.className = 'terminal-btn';
        btn.style.width = '100%';
        btn.style.textAlign = 'left';
        
        const isCurrent = member === battleEngine.playerForce;
        const isFainted = member.currentStability <= 0;
        
        btn.disabled = isCurrent || isFainted;
        
        btn.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${member.nickname}</strong> <span style="font-size:0.75rem;">(LV.${member.level} ${member.type})</span>
                    <br>
                    <span style="font-size:0.75rem; color:#8c9bb0;">Stability: ${member.currentStability}/${member.maxStability}</span>
                </div>
                <div>${isCurrent ? '[ACTIVE]' : isFainted ? '[DEPLETED]' : '[DEPLOY]'}</div>
            </div>
        `;
        
        btn.addEventListener('click', () => {
            overlay.style.display = 'none';
            Sound.playClick();
            battleEngine.selectAction({ type: 'switch', forceIndex: idx });
        });
        
        list.appendChild(btn);
    });
    
    overlay.style.display = 'flex';
    Sound.playClick();
}

function launchSiphonGame() {
    const overlay = document.getElementById('siphon-overlay');
    overlay.classList.add('active');
    
    siphonSystem.start({
        canvas: '#oscilloscope-canvas',
        wavelengthSlider: document.getElementById('slider-wavelength'),
        amplitudeSlider: document.getElementById('slider-amplitude'),
        duration: 5000,
        onComplete: (accuracy) => {
            overlay.classList.remove('active');
            
            const res = battleEngine.resolveSiphon(accuracy);
            if (res.captured) {
                Sound.playConfirm();
                const wild = battleEngine.opponentForce;
                wild.nickname = `Bound ${wild.species}`;
                playerTeam.push(wild);
                updateDexRecord(wild.key, 'captured');
                
                const state = SaveSystem.load();
                if (state) {
                    state.team = playerTeam;
                    SaveSystem.save(state);
                }
            } else {
                Sound.playHit();
            }
        }
    });
    
    const wSlider = document.getElementById('slider-wavelength');
    const aSlider = document.getElementById('slider-amplitude');
    const wVal = document.getElementById('val-wavelength');
    const aVal = document.getElementById('val-amplitude');
    
    wVal.innerText = wSlider.value;
    aVal.innerText = aSlider.value;
    
    wSlider.oninput = () => wVal.innerText = wSlider.value;
    aSlider.oninput = () => aVal.innerText = aSlider.value;
    
    document.getElementById('btn-siphon-confirm').onclick = () => {
        siphonSystem.triggerCapture();
    };
    
    document.getElementById('btn-siphon-abort').onclick = () => {
        siphonSystem.stop();
        overlay.classList.remove('active');
        battleEngine.transitionTo('SELECTION');
    };
}

function resolveBattleEnd() {
    const state = SaveSystem.load();
    if (state) {
        state.team = playerTeam;
        SaveSystem.save(state);
    }
    
    // Hide combat controls grid, show dismissal button
    document.querySelector('.moves-grid').style.display = 'none';
    document.querySelector('.tactical-grid').style.display = 'none';
    document.getElementById('battle-end-controls').style.display = 'block';
}

function openForceDex() {
    showScreen('screen-forcedex');
    const listPane = document.getElementById('dex-list');
    listPane.innerHTML = '';
    
    const saveState = SaveSystem.load() || { discovered: {} };
    const discovered = saveState.discovered || {};
    
    Object.keys(FORCE_SPECIES).forEach(key => {
        const item = document.createElement('div');
        item.className = 'dex-item';
        const status = discovered[key];
        
        if (status === 'captured') {
            item.innerHTML = `<span>${FORCE_SPECIES[key].species}</span> <span style="color:var(--color-entropy)">[SECURED]</span>`;
            item.classList.add('captured');
        } else if (status === 'seen') {
            item.innerHTML = `<span>${FORCE_SPECIES[key].species}</span> <span style="color:var(--color-em)">[SEEN]</span>`;
        } else {
            item.innerHTML = `<span>VECTOR-???</span> <span style="color:#8c9bb0">[UNRESOLVED]</span>`;
            item.style.pointerEvents = 'none';
            item.style.opacity = '0.5';
        }
        
        item.addEventListener('click', () => {
            document.querySelectorAll('.dex-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            displayDexDetail(key, status);
        });
        
        listPane.appendChild(item);
    });
}

function displayDexDetail(key, status) {
    const spec = FORCE_SPECIES[key];
    if (!spec || !status) return;
    
    document.getElementById('dex-species-name').innerText = spec.species;
    document.getElementById('dex-type-tag').innerText = `TYPE: ${spec.primaryType.toUpperCase()}`;
    
    if (status === 'captured') {
        document.getElementById('dex-description').innerText = spec.description;
        document.getElementById('dex-stat-hp').innerText = spec.baseStats.maxStability;
        document.getElementById('dex-stat-atk').innerText = spec.baseStats.attack;
        document.getElementById('dex-stat-def').innerText = spec.baseStats.defense;
        document.getElementById('dex-stat-spd').innerText = spec.baseStats.speed;
        document.getElementById('dex-svg-container').innerHTML = SVGGenerator.generate(key, 'Liquid', 'idle', '100px', '100px');
    } else {
        document.getElementById('dex-description').innerText = "Detailed telemetry locked. Align and capture entity to resolve field equation parameters.";
        document.getElementById('dex-stat-hp').innerText = '??';
        document.getElementById('dex-stat-atk').innerText = '??';
        document.getElementById('dex-stat-def').innerText = '??';
        document.getElementById('dex-stat-spd').innerText = '??';
        document.getElementById('dex-svg-container').innerHTML = SVGGenerator.generate(key, 'Liquid', 'damaged', '100px', '100px');
    }
}

function openTeamConfig() {
    showScreen('screen-team');
    renderTeamConfig();
    Sound.playClick();
}

let draggedIndex = null;
function renderTeamConfig() {
    const container = document.getElementById('team-cards-container');
    container.innerHTML = '';
    
    if (playerTeam.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #8c9bb0; font-family: var(--font-terminal); margin-top: 50px;">
                NO ACTIVE ANOMALY SIGNALS DETECTED IN ROSTER.
                <br>
                SELECT A STARTER FORCE FROM THE RESONANCE LAB.
            </div>
        `;
        return;
    }

    playerTeam.forEach((member, idx) => {
        const card = document.createElement('div');
        card.className = 'glass-panel team-card';
        card.draggable = true;
        card.dataset.index = idx;
        
        const isActive = idx === 0;
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.padding = '12px 20px';
        card.style.gap = '20px';
        card.style.cursor = 'grab';
        card.style.borderRadius = '6px';
        card.style.position = 'relative';
        card.style.marginBottom = '8px';
        
        if (isActive) {
            card.style.borderColor = 'var(--color-resonance)';
            card.style.boxShadow = '0 0 15px rgba(255, 0, 127, 0.15), 0 0 10px rgba(255, 0, 127, 0.1) inset';
        } else {
            card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            card.style.boxShadow = 'none';
        }
        
        const typeColors = {
            'gravity': 'var(--color-gravity)',
            'electromagnetism': 'var(--color-em)',
            'entropy': 'var(--color-entropy)',
            'resonance': 'var(--color-resonance)'
        };
        const colorVal = typeColors[member.type.toLowerCase()] || 'var(--color-em)';
        
        const stabilityPct = Math.ceil((member.currentStability / member.maxStability) * 100);
        const xpNeeded = member.level * 100;
        const xpPct = Math.min(100, Math.ceil((member.xp / xpNeeded) * 100));
        
        card.innerHTML = `
            <div style="position: absolute; top: -8px; left: 15px; font-size: 0.65rem; font-family: var(--font-terminal); background: #05070e; padding: 2px 8px; border-radius: 4px; border: 1px solid ${isActive ? 'var(--color-resonance)' : 'rgba(255,255,255,0.15)'}; color: ${isActive ? 'var(--color-resonance)' : '#8c9bb0'};">
                ${isActive ? 'ACTIVE LOAD OUT VECTOR' : `STANDBY VECTOR #${idx + 1}`}
            </div>
            
            <div style="width: 55px; height: 55px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); pointer-events: none;">
                ${SVGGenerator.generate(member.key || member.species, member.phaseState, 'idle', '48px', '48px')}
            </div>
            
            <div style="width: 140px; pointer-events: none;">
                <strong style="color: #fff; font-size: 1.05rem;">${member.nickname}</strong>
                <div style="font-family: var(--font-terminal); font-size: 0.8rem; color: ${colorVal}; margin-top: 2px;">
                    LV.${member.level} // ${member.type.toUpperCase()}
                </div>
            </div>
            
            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px; font-family: var(--font-terminal); font-size: 0.75rem; pointer-events: none;">
                <div>
                    <div style="display:flex; justify-content:space-between; margin-bottom: 2px; color: #e0e6ed;">
                        <span>STABILITY: ${member.currentStability}/${member.maxStability}</span>
                        <span>${stabilityPct}%</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 3px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="width: ${stabilityPct}%; height: 100%; background: linear-gradient(90deg, var(--color-entropy) 0%, #7fff00 100%);"></div>
                    </div>
                </div>
                
                <div>
                    <div style="display:flex; justify-content:space-between; margin-bottom: 2px; color: #8c9bb0;">
                        <span>RESONANCE LEVEL PROGRESS: ${member.xp}/${xpNeeded} XP</span>
                        <span>${xpPct}%</span>
                    </div>
                    <div style="width: 100%; height: 4px; background: rgba(0,0,0,0.5); border-radius: 2px; overflow: hidden;">
                        <div style="width: ${xpPct}%; height: 100%; background: var(--color-em);"></div>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 15px; font-family: var(--font-terminal); font-size: 0.8rem; color: #8c9bb0; padding-left: 20px; border-left: 1px solid rgba(255,255,255,0.08); pointer-events: none;">
                <div>ATK: <span style="color: #fff;">${member.stats.attack}</span></div>
                <div>DEF: <span style="color: #fff;">${member.stats.defense}</span></div>
                <div>SPD: <span style="color: #fff;">${member.stats.speed}</span></div>
            </div>
            
            <div class="drag-handle" style="font-size: 1.5rem; color: rgba(255,255,255,0.25); cursor: grab; padding-left: 10px; user-select: none; pointer-events: none;">
                ⠿
            </div>
        `;
        
        card.addEventListener('dragstart', (e) => {
            draggedIndex = idx;
            card.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
        });
        
        card.addEventListener('dragend', () => {
            card.style.opacity = '1';
            draggedIndex = null;
        });
        
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedIndex !== null && draggedIndex !== idx) {
                const temp = playerTeam[draggedIndex];
                playerTeam.splice(draggedIndex, 1);
                playerTeam.splice(idx, 0, temp);
                
                const state = SaveSystem.load();
                if (state) {
                    state.team = playerTeam;
                    SaveSystem.save(state);
                }
                
                renderTeamConfig();
                Sound.playConfirm();
            }
        });
        
        container.appendChild(card);
    });
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

// Start a new game
document.getElementById('btn-start-game').addEventListener('click', () => {
    resonatorName = document.getElementById('resonator-name').value.trim() || "Resonator-01";
    playerTeam = [];
    window.playerTeam = playerTeam; // sync
    window.storyState = 'WOKE_UP';
    window.takenPodX = -1;
    
    const saveState = {
        resonatorName,
        storyState: 'WOKE_UP',
        takenPodX: -1,
        activeMap: 'home',
        position: { x: 4, y: 4 },
        team: playerTeam,
        discovered: {}
    };
    
    SaveSystem.save(saveState);
    initGame(saveState);
});

// Sound clicking triggers
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('.starter-card')) {
        Sound.playClick();
    }
});

// Active repaint overworld ticker for animated anomalies
setInterval(() => {
    if (overworld && overworld.active && !window.dialogueActive) {
        overworld.draw();
    }
}, 150);

// Check if save game exists and show resume button
window.addEventListener('DOMContentLoaded', () => {
    if (SaveSystem.exists()) {
        const btnResume = document.getElementById('btn-resume-game');
        if (btnResume) {
            btnResume.style.display = 'inline-block';
            btnResume.addEventListener('click', () => {
                loadGameData();
            });
        }
    }
});
