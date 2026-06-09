window.ForceBound = window.ForceBound || {};

class BattleEngine {
    constructor(options = {}) {
        this.movesDatabase = options.movesDatabase || window.MOVES;
        this.playerForce = null;
        this.opponentForce = null;
        this.playerTeam = [];
        this.state = 'FINISHED';
        this.battleLog = [];
        this.turnQueue = [];
        this.result = null;

        this.onStateChange = options.onStateChange || null;
        this.onLog = options.onLog || null;
        this.onVfx = options.onVfx || null;
        
        this.playerSvgState = 'idle';
        this.enemySvgState = 'idle';
    }

    log(msg) {
        this.battleLog.push(msg);
        if (this.onLog) this.onLog(msg);
    }

    transitionTo(newState) {
        this.state = newState;
        if (this.onStateChange) this.onStateChange(newState);
    }

    startBattle(playerForce, opponentForce, playerTeam) {
        this.playerForce = playerForce;
        this.opponentForce = opponentForce;
        this.playerTeam = playerTeam;
        this.battleLog = [];
        this.result = null;
        
        if (this.playerForce.currentEnergy === undefined) this.playerForce.currentEnergy = 50;
        if (this.opponentForce.currentEnergy === undefined) this.opponentForce.currentEnergy = 50;

        this.log(`Field Anomaly Warning: Wild ${opponentForce.species.toUpperCase()} detected!`);
        this.log(`Deploying ${playerForce.nickname} into alignment vector.`);
        this.transitionTo('SELECTION');
    }

    selectOpponentAction() {
        const moves = this.opponentForce.moves || [];
        if (moves.length === 0) {
            return { type: 'attack', move: { name: 'Quantum Punch', type: 'Gravity', power: 35, energyCost: 0 } };
        }

        let chosenMove = moves[0];
        let bestMult = -1;
        for (const mName of moves) {
            const m = this.movesDatabase[mName] || { type: 'Gravity', power: 40, energyCost: 5 };
            const mult = this.getTypeMultiplier(m.type, this.playerForce.type);
            if (mult > bestMult) {
                bestMult = mult;
                chosenMove = mName;
            }
        }
        return { type: 'attack', move: this.movesDatabase[chosenMove] };
    }

    async selectAction(playerAction) {
        if (this.state !== 'SELECTION' && this.state !== 'SWAP_PROMPT') return;

        if (this.state === 'SWAP_PROMPT') {
            if (playerAction.type !== 'switch') return;
            const newForce = this.playerTeam[playerAction.forceIndex];
            this.playerForce = newForce;
            this.log(`Resonator switch complete. Sending in ${newForce.nickname}!`);
            this.transitionTo('SELECTION');
            return;
        }

        const opponentAction = this.selectOpponentAction();
        this.transitionTo('ORDERING');
        this.orderActions(playerAction, opponentAction);
        this.transitionTo('EXECUTION');
        await this.executeTurnAsync();
    }

    getModifiedSpeed(force) {
        let speed = force.stats.speed || 10;
        if (force.phaseState === 'Solid') speed *= 0.8;
        if (force.phaseState === 'Plasma') speed *= 1.2;
        return speed;
    }

    getModifiedAttack(force) {
        let attack = force.stats.attack || 10;
        if (force.phaseState === 'Plasma') attack *= 1.4;
        return attack;
    }

    getModifiedDefense(force) {
        let defense = force.stats.defense || 10;
        if (force.phaseState === 'Solid') defense *= 1.3;
        if (force.phaseState === 'Plasma') defense *= 0.7;
        return defense;
    }

    getTypeMultiplier(atkType, defType) {
        let mult = 1.0;
        const chart = window.TYPE_CHART || ForceBound.TYPE_CHART;
        if (chart[atkType] && chart[atkType][defType] !== undefined) {
            mult = chart[atkType][defType];
        }
        if (defType === 'Resonance' && atkType !== 'Resonance') {
            mult = 1.5;
        }
        return mult;
    }

    calculateDamage(attacker, defender, move) {
        const basePower = move.power || 40;
        const atk = this.getModifiedAttack(attacker);
        const def = this.getModifiedDefense(defender);
        const typeMult = this.getTypeMultiplier(move.type, defender.type);
        const stab = move.type === attacker.type ? 1.2 : 1.0;
        const variance = 0.85 + Math.random() * 0.30;
        // Divide by 4 to scale damage to match stability pool levels
        return Math.max(1, Math.floor((basePower * (atk / def) * typeMult * stab * variance) / 4));
    }

    orderActions(playerAction, opponentAction) {
        const getPriority = (action) => {
            switch (action.type) {
                case 'switch': return 10;
                case 'flee': return 9;
                case 'siphon': return 8;
                default: return 0;
            }
        };

        const pPlayer = getPriority(playerAction);
        const pOpponent = getPriority(opponentAction);

        if (pPlayer > pOpponent) {
            this.buildTurnQueue(playerAction, opponentAction, true);
        } else if (pOpponent > pPlayer) {
            this.buildTurnQueue(playerAction, opponentAction, false);
        } else {
            const sPlayer = this.getModifiedSpeed(this.playerForce);
            const sOpponent = this.getModifiedSpeed(this.opponentForce);
            this.buildTurnQueue(playerAction, opponentAction, sPlayer >= sOpponent);
        }
    }

    buildTurnQueue(playerAction, opponentAction, playerFirst) {
        const p = { actor: this.playerForce, target: this.opponentForce, action: playerAction, isPlayer: true };
        const o = { actor: this.opponentForce, target: this.playerForce, action: opponentAction, isPlayer: false };
        this.turnQueue = playerFirst ? [p, o] : [o, p];
    }

    async executeTurnAsync() {
        this.playerSvgState = 'idle';
        this.enemySvgState = 'idle';

        for (const turn of this.turnQueue) {
            if (turn.actor.currentStability <= 0) continue;

            if (turn.action.type === 'switch') {
                const newForce = this.playerTeam[turn.action.forceIndex];
                this.log(`${turn.actor.nickname} was recalled.`);
                this.playerForce = newForce;
                this.transitionTo('EXECUTION');
                await new Promise(r => setTimeout(r, 800));
                this.log(`Deployed ${newForce.nickname}!`);
                this.transitionTo('EXECUTION');
                await new Promise(r => setTimeout(r, 800));
            } else if (turn.action.type === 'flee') {
                const pSpeed = this.getModifiedSpeed(this.playerForce);
                const oSpeed = this.getModifiedSpeed(this.opponentForce);
                const escapeChance = pSpeed >= oSpeed ? 0.80 : 0.45;
                if (Math.random() < escapeChance) {
                    this.log(`Escape trajectory locked. Left combat.`);
                    this.result = 'escaped';
                    this.transitionTo('FINISHED');
                    return;
                } else {
                    this.log("Escape attempt blocked by opposing magnetic fluctuations!");
                    this.transitionTo('EXECUTION');
                    await new Promise(r => setTimeout(r, 1000));
                }
            } else if (turn.action.type === 'siphon') {
                this.log(`Siphon online. Aligning coupling frequency...`);
                this.transitionTo('SIPHON_ACTIVE');
                return;
            } else if (turn.action.type === 'attack') {
                const move = turn.action.move;
                const cost = move.energyCost || 0;
                if (turn.actor.currentEnergy !== undefined && turn.actor.currentEnergy < cost) {
                    this.log(`${turn.actor.nickname} lacks energy to channel ${move.name}!`);
                    this.transitionTo('EXECUTION');
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }

                if (turn.actor.currentEnergy !== undefined) {
                    turn.actor.currentEnergy = Math.max(0, turn.actor.currentEnergy - cost);
                }

                this.log(`${turn.actor.nickname} channelled ${move.name}!`);
                
                if (turn.isPlayer) {
                    this.playerSvgState = 'attacking';
                } else {
                    this.enemySvgState = 'attacking';
                }
                
                if (this.onVfx) {
                    this.onVfx({ type: move.type, isPlayer: turn.isPlayer });
                }
                
                this.transitionTo('EXECUTION');
                await new Promise(r => setTimeout(r, 600));

                const dmg = this.calculateDamage(turn.actor, turn.target, move);
                turn.target.currentStability = Math.max(0, turn.target.currentStability - dmg);

                this.log(`Dealt ${dmg} stability damage to ${turn.target.nickname}.`);

                if (turn.isPlayer) {
                    this.enemySvgState = 'damaged';
                    this.playerSvgState = 'idle';
                } else {
                    this.playerSvgState = 'damaged';
                    this.enemySvgState = 'idle';
                }
                
                this.transitionTo('EXECUTION');
                
                const mult = this.getTypeMultiplier(move.type, turn.target.type);
                if (mult > 1.0) this.log(`Amplified resonance detected! Super-effective.`);
                if (mult < 1.0) this.log(`Dampened resonance detected. Ineffective.`);
                
                await new Promise(r => setTimeout(r, 1000));
                
                this.playerSvgState = 'idle';
                this.enemySvgState = 'idle';
                this.transitionTo('EXECUTION');
            }

            if (turn.target.currentStability <= 0) {
                this.log(`${turn.target.nickname} field stability collapsed!`);
                this.transitionTo('EXECUTION');
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        const regen = (f) => {
            if (f.currentStability > 0 && f.phaseState === 'Liquid') {
                const amt = Math.floor(f.maxStability * 0.05);
                f.currentStability = Math.min(f.maxStability, f.currentStability + amt);
                this.log(`${f.nickname} self-stabilized by +${amt}% (Liquid state).`);
                return true;
            }
            return false;
        };
        const pRegen = regen(this.playerForce);
        const oRegen = regen(this.opponentForce);
        if (pRegen || oRegen) {
            this.transitionTo('EXECUTION');
            await new Promise(r => setTimeout(r, 1000));
        }

        this.evaluateStability();
    }

    evaluateStability() {
        if (this.state === 'FINISHED' || this.state === 'SIPHON_ACTIVE') return;

        const pfFainted = this.playerForce.currentStability <= 0;
        const efFainted = this.opponentForce.currentStability <= 0;

        if (efFainted) {
            this.log(`Wild ${this.opponentForce.species.toUpperCase()} neutralized.`);
            const xp = this.opponentForce.level * 30;
            this.playerForce.xp += xp;
            this.log(`${this.playerForce.nickname} gained +${xp} XP.`);

            if (this.playerForce.xp >= this.playerForce.level * 100) {
                this.playerForce.level++;
                this.playerForce.xp = 0;
                this.playerForce.maxStability += 6;
                this.playerForce.currentStability = this.playerForce.maxStability;
                this.playerForce.stats.attack += 2;
                this.playerForce.stats.defense += 2;
                this.playerForce.stats.speed += 1;
                this.log(`${this.playerForce.nickname} shifted energy levels! Level ${this.playerForce.level}!`);
            }
            this.result = 'victory';
            this.transitionTo('FINISHED');
        } else if (pfFainted) {
            const viable = this.playerTeam.filter(m => m.currentStability > 0);
            if (viable.length > 0) {
                this.log(`${this.playerForce.nickname} collapsed. Calibrating replacement...`);
                this.transitionTo('SWAP_PROMPT');
            } else {
                this.log(`Resonator fields fully depleted. Battle lost.`);
                this.result = 'defeat';
                this.transitionTo('FINISHED');
            }
        } else {
            this.transitionTo('SELECTION');
        }
    }

    resolveSiphon(accuracy) {
        const stabilityFactor = 1.0 - (this.opponentForce.currentStability / this.opponentForce.maxStability);
        const chance = stabilityFactor * accuracy;
        const roll = Math.random();

        if (roll < chance) {
            this.log(`Resonance lock established! Siphon successful.`);
            this.result = 'captured';
            this.transitionTo('FINISHED');
            return { captured: true };
        } else {
            this.log(`Resonance slip! Target field resisted siphoning.`);
            this.transitionTo('SELECTION');
            return { captured: false };
        }
    }
}

ForceBound.BattleEngine = BattleEngine;
window.BattleEngine = ForceBound.BattleEngine; // Expose globally for backward compatibility
