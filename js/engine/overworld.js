window.ForceBound = window.ForceBound || {};

ForceBound.MAPS = {
    home: {
        id: 'home',
        width: 12,
        height: 10,
        doors: {
            '6,9': { map: 'town', x: 5, y: 7 }
        },
        npcs: {
            '4,4': { id: 'mom', name: 'M-0T', sprite: 'mom', dialog: 'mom' }
        },
        generate() {
            const grid = [];
            for (let y = 0; y < this.height; y++) {
                const row = [];
                for (let x = 0; x < this.width; x++) {
                    if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                        row.push(0);
                    } else if (y === 1) {
                        row.push(0);
                    } else {
                        row.push(1);
                    }
                }
                grid.push(row);
            }
            grid[2][2] = 5; // PC desk
            grid[2][8] = 0; // Bed
            grid[9][6] = 1;
            return grid;
        }
    },
    town: {
        id: 'town',
        width: 25,
        height: 20,
        doors: {
            '5,6': { map: 'home', x: 6, y: 8 },
            '15,8': { map: 'lab', x: 6, y: 8 },
            '12,0': { map: 'route1', x: 10, y: 38 }
        },
        npcs: {
            '12,1': { id: 'guard', name: 'Kyle', sprite: 'guard', dialog: 'guard' },
            '8,12': { id: 'scientist', name: 'Bob', sprite: 'scientist', dialog: 'scientist' }
        },
        generate() {
            const grid = [];
            for (let y = 0; y < this.height; y++) {
                const row = [];
                for (let x = 0; x < this.width; x++) {
                    if (x === 0 || x === this.width - 1 || y === this.height - 1) {
                        row.push(0);
                    } else if (y === 0) {
                        row.push(x === 12 ? 1 : 0);
                    } else if (x >= 3 && x <= 7 && y >= 4 && y <= 6) {
                        row.push((x === 5 && y === 6) ? 1 : 0);
                    } else if (x >= 12 && x <= 18 && y >= 5 && y <= 8) {
                        row.push((x === 15 && y === 8) ? 1 : 0);
                    } else {
                        row.push(1);
                    }
                }
                grid.push(row);
            }
            return grid;
        }
    },
    lab: {
        id: 'lab',
        width: 12,
        height: 10,
        doors: {
            '6,9': { map: 'town', x: 15, y: 9 }
        },
        npcs: {
            '6,3': { id: 'aris', name: 'Dr. Aris', sprite: 'professor', dialog: 'professor' }
        },
        generate() {
            const grid = [];
            for (let y = 0; y < this.height; y++) {
                const row = [];
                for (let x = 0; x < this.width; x++) {
                    if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                        row.push(0);
                    } else if (y === 1) {
                        row.push(0);
                    } else {
                        row.push(1);
                    }
                }
                grid.push(row);
            }
            if (window.takenPodX !== 4) grid[5][4] = 4; else grid[5][4] = 1;
            if (window.takenPodX !== 6) grid[5][6] = 4; else grid[5][6] = 1;
            if (window.takenPodX !== 8) grid[5][8] = 4; else grid[5][8] = 1;
            grid[9][6] = 1;
            return grid;
        }
    },
    route1: {
        id: 'route1',
        width: 20,
        height: 40,
        doors: {
            '10,39': { map: 'town', x: 12, y: 1 }
        },
        npcs: {
            '10,5': { id: 'node', name: 'Resonance Node', sprite: 'node', dialog: 'node' }
        },
        generate() {
            const grid = [];
            for (let y = 0; y < this.height; y++) {
                const row = [];
                for (let x = 0; x < this.width; x++) {
                    if (x === 0 || x === this.width - 1) {
                        row.push(0);
                    } else if (y === 39) {
                        row.push(x === 10 ? 1 : 0);
                    } else if (y === 0) {
                        row.push(0);
                    } else if ((y >= 10 && y <= 15 && x >= 3 && x <= 9) || 
                               (y >= 20 && y <= 25 && x >= 10 && x <= 16) ||
                               (y >= 30 && y <= 34 && x >= 4 && x <= 12)) {
                        row.push(2);
                    } else {
                        row.push(1);
                    }
                }
                grid.push(row);
            }
            return grid;
        }
    }
};

class OverworldEngine {
    constructor(canvas, options = {}) {
        this.canvas = typeof canvas === 'string' ? document.querySelector(canvas) : canvas;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        this.currentMap = options.activeMap || 'home';
        this.mapWidth = ForceBound.MAPS[this.currentMap].width;
        this.mapHeight = ForceBound.MAPS[this.currentMap].height;
        this.tileSize = 16;
        
        const initialPlayer = options.player || {};
        this.player = {
            x: initialPlayer.x !== undefined ? initialPlayer.x : 4,
            y: initialPlayer.y !== undefined ? initialPlayer.y : 4,
            direction: initialPlayer.direction || 'down',
            alignment: initialPlayer.alignment || 'none'
        };

        this.grid = ForceBound.MAPS[this.currentMap].generate();
        this.onStepCallback = options.onStep || null;
        this.onEncounter = options.onEncounter || null;

        this.active = false;
        this._keydownHandler = null;
        
        if (this.canvas) {
            this.resize();
        }
    }

    resize() {
        if (!this.canvas) return;
        this.tileSize = Math.min(this.canvas.width / this.mapWidth, this.canvas.height / this.mapHeight);
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return false;
        const tile = this.grid[y][x];
        if (tile === 0 || tile === 4 || tile === 5) return false; // solid walls, pods, PC
        
        // Kyle blocks Route 1 exit if storyState is incomplete
        if (this.currentMap === 'town' && x === 12 && y === 1) {
            if (window.storyState === 'WOKE_UP' || window.storyState === 'TALKED_MOM') {
                return false;
            }
        }
        
        // Block other NPCs
        const npcKey = `${x},${y}`;
        const activeMapObj = ForceBound.MAPS[this.currentMap];
        if (activeMapObj.npcs && activeMapObj.npcs[npcKey]) {
            if (activeMapObj.npcs[npcKey].id !== 'node') {
                return false;
            }
        }
        
        return true;
    }

    start() {
        if (this.active) return;
        this.active = true;
        this._keydownHandler = this.handleKeyDown.bind(this);
        window.addEventListener('keydown', this._keydownHandler);
        this.draw();
    }

    stop() {
        this.active = false;
        if (this._keydownHandler) {
            window.removeEventListener('keydown', this._keydownHandler);
            this._keydownHandler = null;
        }
    }

    handleKeyDown(e) {
        if (!this.active) return;

        if (window.dialogueActive) {
            if (e.key === ' ' || e.key === 'Enter') {
                advanceDialogue();
            }
            e.preventDefault();
            return;
        }

        if (e.key === ' ' || e.key === 'Enter') {
            this.interact();
            e.preventDefault();
            return;
        }

        let dx = 0, dy = 0;
        let dir = this.player.direction;

        switch (e.key) {
            case 'w': case 'W': case 'ArrowUp': dy = -1; dir = 'up'; break;
            case 's': case 'S': case 'ArrowDown': dy = 1; dir = 'down'; break;
            case 'a': case 'A': case 'ArrowLeft': dx = -1; dir = 'left'; break;
            case 'd': case 'D': case 'ArrowRight': dx = 1; dir = 'right'; break;
            default: return;
        }

        e.preventDefault();
        this.player.direction = dir;
        const nextX = this.player.x + dx;
        const nextY = this.player.y + dy;

        // Auto-dialog check when walking into Kyle Guard
        if (this.currentMap === 'town' && nextX === 12 && nextY === 1 && (window.storyState === 'WOKE_UP' || window.storyState === 'TALKED_MOM')) {
            this.player.direction = 'up';
            triggerNPCDialogue('guard');
            this.draw();
            return;
        }

        if (this.isWalkable(nextX, nextY)) {
            this.player.x = nextX;
            this.player.y = nextY;
            this.onStep(nextX, nextY);
        }
        this.draw();
    }

    interact() {
        let checkX = this.player.x;
        let checkY = this.player.y;
        
        if (this.player.direction === 'up') checkY--;
        else if (this.player.direction === 'down') checkY++;
        else if (this.player.direction === 'left') checkX--;
        else if (this.player.direction === 'right') checkX++;
        
        const activeMapObj = ForceBound.MAPS[this.currentMap];
        const npcKey = `${checkX},${checkY}`;
        if (activeMapObj.npcs && activeMapObj.npcs[npcKey]) {
            const npc = activeMapObj.npcs[npcKey];
            triggerNPCDialogue(npc.id);
            return;
        }
        
        if (this.currentMap === 'lab' && checkY === 5 && (checkX === 4 || checkX === 6 || checkX === 8)) {
            interactWithPod(checkX);
            return;
        }
        
        if (this.currentMap === 'home' && checkX === 2 && checkY === 2) {
            interactWithPC();
            return;
        }
    }

    warpToMap(mapId, targetX, targetY) {
        this.stop();
        ForceBound.Sound.playConfirm();
        
        const body = document.getElementById('game-body');
        body.classList.add('glitch-active');
        
        setTimeout(() => {
            body.classList.remove('glitch-active');
            this.currentMap = mapId;
            this.grid = ForceBound.MAPS[mapId].generate();
            this.mapWidth = ForceBound.MAPS[mapId].width;
            this.mapHeight = ForceBound.MAPS[mapId].height;
            this.resize();
            
            this.player.x = targetX;
            this.player.y = targetY;
            
            const sectorNames = {
                home: "RESONATOR QUARTERS",
                town: "VECTOR STATION ALPHA",
                lab: "RESONANCE LAB",
                route1: "ROUTE 1 - THE OUTLANDS"
            };
            document.getElementById('hud-sector').innerText = `SECTOR: ${sectorNames[mapId] || 'UNKNOWN'}`;
            
            this.start();
            this.draw();
        }, 300);
    }

    onStep(x, y) {
        if (this.onStepCallback) this.onStepCallback(x, y);

        // Check Warp doors
        const doorKey = `${x},${y}`;
        const activeMapObj = ForceBound.MAPS[this.currentMap];
        if (activeMapObj.doors && activeMapObj.doors[doorKey]) {
            const door = activeMapObj.doors[doorKey];
            this.warpToMap(door.map, door.x, door.y);
            return;
        }
        
        // Anomaly field wild encounter step check
        if (this.grid[y][x] === 2 && playerTeam.length > 0) {
            if (Math.random() < 0.10) { 
                if (this.onEncounter) this.onEncounter(x, y);
            }
        }
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.fillStyle = 'hsl(230, 25%, 5%)';
        this.ctx.fillRect(0, 0, w, h);

        const activeMapObj = ForceBound.MAPS[this.currentMap];
        const mapW = this.mapWidth * this.tileSize;
        const mapH = this.mapHeight * this.tileSize;
        const offsetX = Math.floor((w - mapW) / 2);
        const offsetY = Math.floor((h - mapH) / 2);

        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = this.grid[y][x];
                const px = offsetX + x * this.tileSize;
                const py = offsetY + y * this.tileSize;

                // Wall block
                if (tile === 0) {
                    this.ctx.fillStyle = 'hsl(250, 15%, 12%)';
                    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = 'hsl(250, 15%, 22%)';
                    this.ctx.strokeRect(px + 1, py + 1, this.tileSize - 2, this.tileSize - 2);
                } 
                // Anomaly pulsing zone
                else if (tile === 2) {
                    this.ctx.fillStyle = 'hsl(230, 25%, 9%)';
                    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                    const tGlow = Math.sin(Date.now() / 250) * 0.15 + 0.35;
                    this.ctx.fillStyle = `rgba(57, 255, 20, ${tGlow})`;
                    this.ctx.beginPath();
                    this.ctx.arc(px + this.tileSize/2, py + this.tileSize/2, this.tileSize/3, 0, Math.PI*2);
                    this.ctx.fill();
                } 
                // Barrier cyan line
                else if (tile === 3) {
                    this.ctx.fillStyle = 'hsl(230, 25%, 8%)';
                    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = 'hsl(180, 100%, 50%)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(px + this.tileSize/2, py);
                    this.ctx.lineTo(px + this.tileSize/2, py + this.tileSize);
                    this.ctx.stroke();
                } 
                // Lab Starter Pod counter
                else if (tile === 4) {
                    this.ctx.fillStyle = '#1c2035';
                    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = '#2d3350';
                    this.ctx.strokeRect(px, py, this.tileSize, this.tileSize);
                    
                    let hasPod = false;
                    let podColor = 'hsl(180, 100%, 50%)';
                    if (x === 4 && window.takenPodX !== 4) { hasPod = true; podColor = 'hsl(271, 76%, 53%)'; }
                    if (x === 6 && window.takenPodX !== 6) { hasPod = true; podColor = 'hsl(180, 100%, 50%)'; }
                    if (x === 8 && window.takenPodX !== 8) { hasPod = true; podColor = 'hsl(110, 100%, 54%)'; }
                    
                    if (hasPod) {
                        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.5)';
                        this.ctx.lineWidth = 1;
                        this.ctx.beginPath();
                        this.ctx.arc(px + this.tileSize/2, py + this.tileSize/3, this.tileSize/4, 0, Math.PI * 2);
                        this.ctx.stroke();
                        this.ctx.fillStyle = podColor;
                        this.ctx.beginPath();
                        this.ctx.arc(px + this.tileSize/2, py + this.tileSize/3, this.tileSize/8, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
                // PC Green monitor
                else if (tile === 5) {
                    this.ctx.fillStyle = '#0a0b10';
                    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = '#39ff14';
                    this.ctx.strokeRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4);
                    this.ctx.fillStyle = '#39ff14';
                    this.ctx.fillRect(px + 4, py + 4, this.tileSize - 8, this.tileSize / 3);
                }
                // Walkable floor paths
                else {
                    this.ctx.fillStyle = 'hsl(230, 25%, 10%)';
                    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                }

                // Door overlay
                const coordKey = `${x},${y}`;
                if (activeMapObj.doors && activeMapObj.doors[coordKey]) {
                    this.ctx.fillStyle = 'rgba(255, 0, 127, 0.25)';
                    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = 'hsl(330, 100%, 50%)';
                    this.ctx.strokeRect(px, py, this.tileSize, this.tileSize);
                }
            }
        }

        // Draw NPCs
        if (activeMapObj.npcs) {
            Object.keys(activeMapObj.npcs).forEach(key => {
                const npc = activeMapObj.npcs[key];
                const coords = key.split(',');
                const nx = parseInt(coords[0]), ny = parseInt(coords[1]);
                const px = offsetX + nx * this.tileSize + this.tileSize / 2;
                const py = offsetY + ny * this.tileSize + this.tileSize / 2;
                
                let color = 'hsl(180, 100%, 50%)';
                let isBeacon = false;
                if (npc.id === 'mom') color = 'hsl(180, 100%, 50%)';
                else if (npc.id === 'guard') color = 'hsl(35, 100%, 50%)';
                else if (npc.id === 'aris') color = 'hsl(271, 76%, 53%)';
                else if (npc.id === 'scientist') color = 'hsl(110, 100%, 54%)';
                else if (npc.id === 'node') {
                    color = window.storyState === 'NODE_STABILIZED' ? 'hsl(110, 100%, 54%)' : 'hsl(330, 100%, 50%)';
                    isBeacon = true;
                }

                this.ctx.fillStyle = color;
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = isBeacon ? 12 : 5;

                this.ctx.beginPath();
                if (isBeacon) {
                    // Draw diamond beacon shape
                    this.ctx.moveTo(px, py - this.tileSize / 2.5);
                    this.ctx.lineTo(px + this.tileSize / 2.5, py);
                    this.ctx.lineTo(px, py + this.tileSize / 2.5);
                    this.ctx.lineTo(px - this.tileSize / 2.5, py);
                } else {
                    this.ctx.arc(px, py, this.tileSize / 3.5, 0, Math.PI * 2);
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            });
        }

        // Draw Player
        const ppx = offsetX + this.player.x * this.tileSize + this.tileSize / 2;
        const ppy = offsetY + this.player.y * this.tileSize + this.tileSize / 2;
        const pSize = this.tileSize * 0.38;

        this.ctx.fillStyle = 'hsl(330, 100%, 50%)';
        this.ctx.shadowColor = 'hsl(330, 100%, 50%)';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        if (this.player.direction === 'up') {
            this.ctx.moveTo(ppx, ppy - pSize);
            this.ctx.lineTo(ppx - pSize, ppy + pSize);
            this.ctx.lineTo(ppx + pSize, ppy + pSize);
        } else if (this.player.direction === 'down') {
            this.ctx.moveTo(ppx, ppy + pSize);
            this.ctx.lineTo(ppx - pSize, ppy - pSize);
            this.ctx.lineTo(ppx + pSize, ppy - pSize);
        } else if (this.player.direction === 'left') {
            this.ctx.moveTo(ppx - pSize, ppy);
            this.ctx.lineTo(ppx + pSize, ppy - pSize);
            this.ctx.lineTo(ppx + pSize, ppy + pSize);
        } else {
            this.ctx.moveTo(ppx + pSize, ppy);
            this.ctx.lineTo(ppx - pSize, ppy - pSize);
            this.ctx.lineTo(ppx - pSize, ppy + pSize);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
}

ForceBound.OverworldEngine = OverworldEngine;
window.MAPS = ForceBound.MAPS; // Expose globally for backward compatibility
