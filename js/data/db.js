window.ForceBound = window.ForceBound || {};

ForceBound.TYPE_CHART = {
    Gravity: { Gravity: 1.0, Electromagnetism: 1.5, Entropy: 0.5, Resonance: 1.5 },
    Electromagnetism: { Gravity: 0.5, Electromagnetism: 1.0, Entropy: 1.5, Resonance: 1.5 },
    Entropy: { Gravity: 1.5, Electromagnetism: 0.5, Entropy: 1.0, Resonance: 1.5 },
    Resonance: { Gravity: 1.0, Electromagnetism: 1.0, Entropy: 1.0, Resonance: 1.5 }
};

ForceBound.FORCE_SPECIES = {
    graviton: {
        species: "Graviton",
        primaryType: "Gravity",
        baseStats: { maxStability: 60, attack: 40, defense: 65, speed: 35 },
        phaseStates: [
            { state: "Solid", threshold: 0 },
            { state: "Liquid", threshold: 18 },
            { state: "Plasma", threshold: 36 }
        ],
        description: "A localized warp in space-time curvature. Gravitons exert a massive attraction that bends nearby energy fields, sacrificing speed for dense gravitational shielding.",
        startingMoves: ["kinetic_strike", "gravitational_pull"]
    },
    electron: {
        species: "Electron",
        primaryType: "Electromagnetism",
        baseStats: { maxStability: 45, attack: 55, defense: 40, speed: 60 },
        phaseStates: [
            { state: "Solid", threshold: 0 },
            { state: "Liquid", threshold: 15 },
            { state: "Plasma", threshold: 30 }
        ],
        description: "An elementary excitation of the electromagnetic field. Extremely agile and charged with high potential energy, it sparks unpredictably to override opposing forces.",
        startingMoves: ["discharge", "magnetic_shield"]
    },
    entropist: {
        species: "Entropist",
        primaryType: "Entropy",
        baseStats: { maxStability: 50, attack: 60, defense: 45, speed: 45 },
        phaseStates: [
            { state: "Solid", threshold: 0 },
            { state: "Liquid", threshold: 16 },
            { state: "Plasma", threshold: 32 }
        ],
        description: "An anomaly embodying the inexorable decay of order. It thrives in chaotic environments, gradually breaking down organized molecular structures.",
        startingMoves: ["thermal_dissipation", "decay_bolt"]
    },
    photon: {
        species: "Photon",
        primaryType: "Electromagnetism",
        baseStats: { maxStability: 40, attack: 70, defense: 30, speed: 70 },
        phaseStates: [
            { state: "Solid", threshold: 0 },
            { state: "Liquid", threshold: 14 },
            { state: "Plasma", threshold: 28 }
        ],
        description: "A packet of pure electromagnetic radiation. Lacking rest mass, it travels at the cosmic speed limit, firing highly focused beams of coherent light before targets can react.",
        startingMoves: ["discharge", "photon_beam"]
    },
    tachyon: {
        species: "Tachyon",
        primaryType: "Resonance",
        baseStats: { maxStability: 35, attack: 75, defense: 25, speed: 85 },
        phaseStates: [
            { state: "Solid", threshold: 0 },
            { state: "Liquid", threshold: 20 },
            { state: "Plasma", threshold: 40 }
        ],
        description: "A hypothetical faster-than-light particle. Operating beyond causality, it vibrates at extreme resonance frequencies to warp localized reality at the cost of defensive stability.",
        startingMoves: ["resonance_pulse", "quantum_flicker"]
    },
    quark: {
        species: "Quark",
        primaryType: "Gravity",
        baseStats: { maxStability: 55, attack: 50, defense: 60, speed: 40 },
        phaseStates: [
            { state: "Solid", threshold: 0 },
            { state: "Liquid", threshold: 17 },
            { state: "Plasma", threshold: 34 }
        ],
        description: "A fundamental constituent of hadronic matter. Bound tightly by the strong interaction, it has immense mass density, forming a stable nucleus of gravitational pull.",
        startingMoves: ["kinetic_strike", "strong_binding"]
    }
};

ForceBound.MOVES = {
    kinetic_strike: {
        id: "kinetic_strike",
        name: "Kinetic Strike",
        power: 45,
        energyCost: 6,
        accuracy: 95,
        type: "Gravity",
        description: "Impacts the target with concentrated gravitational mass.",
        effects: { speedDebuff: 0.1 }
    },
    gravitational_pull: {
        id: "gravitational_pull",
        name: "Gravitational Pull",
        power: 60,
        energyCost: 12,
        accuracy: 90,
        type: "Gravity",
        description: "Increases gravity to drag the opponent down, lowering their speed.",
        effects: { speedDebuff: 0.2 }
    },
    discharge: {
        id: "discharge",
        name: "Discharge",
        power: 50,
        energyCost: 8,
        accuracy: 95,
        type: "Electromagnetism",
        description: "Releases a static burst of electromagnetic energy.",
        effects: { paralyzeChance: 0.1 }
    },
    magnetic_shield: {
        id: "magnetic_shield",
        name: "Magnetic Shield",
        power: 0,
        energyCost: 6,
        accuracy: 100,
        type: "Electromagnetism",
        description: "Deploys a magnetic field that raises defense.",
        effects: { defenseBuff: 0.2 }
    },
    thermal_dissipation: {
        id: "thermal_dissipation",
        name: "Thermal Dissipation",
        power: 55,
        energyCost: 10,
        accuracy: 90,
        type: "Entropy",
        description: "Drains thermal energy, causing the target's fields to decay.",
        effects: { decay: true, decayRate: 0.05 }
    },
    decay_bolt: {
        id: "decay_bolt",
        name: "Decay Bolt",
        power: 70,
        energyCost: 16,
        accuracy: 85,
        type: "Entropy",
        description: "Fires a bolt of pure thermodynamic decay, accelerating degradation.",
        effects: { decay: true, decayRate: 0.08 }
    },
    resonance_pulse: {
        id: "resonance_pulse",
        name: "Resonance Pulse",
        power: 65,
        energyCost: 14,
        accuracy: 90,
        type: "Resonance",
        description: "Emits a wave tuned to the target's natural frequency, disrupting stability.",
        effects: { resonanceBoost: 0.1 }
    },
    quantum_flicker: {
        id: "quantum_flicker",
        name: "Quantum Flicker",
        power: 40,
        energyCost: 8,
        accuracy: 100,
        type: "Resonance",
        description: "Flickers in the quantum plane, dealing quick damage and boosting speed.",
        effects: { speedBuff: 0.15 }
    },
    photon_beam: {
        id: "photon_beam",
        name: "Photon Beam",
        power: 85,
        energyCost: 20,
        accuracy: 80,
        type: "Electromagnetism",
        description: "Fires a high-energy beam of coherent photons at light speed.",
        effects: { accuracyDebuff: 0.1 }
    },
    strong_binding: {
        id: "strong_binding",
        name: "Strong Binding",
        power: 50,
        energyCost: 12,
        accuracy: 95,
        type: "Gravity",
        description: "Binds quarks together tightly, creating pressure that reduces defense.",
        effects: { defenseDebuff: 0.15 }
    }
};

ForceBound.DIALOGUE_DATABASE = {
    mom: {
        woke_up: [
            "M-0T: System diagnostics complete. Sleep cycle terminated.",
            "M-0T: Dr. Aris is requesting your presence at the lab immediately. Spacetime stability is fluctuating.",
            "M-0T: Recharge systems are online. Come back anytime to recharge your team's energy fields."
        ],
        general: [
            "M-0T: Resonator active status verified.",
            "M-0T: Injecting harmonic field resonance... Fields restored to 100%!",
            "M-0T: Maintain frequency alignment to prevent field separation."
        ]
    },
    guard: {
        block: [
            "Kyle: Halt, Resonator. Outer field vectors are currently collapsing.",
            "Kyle: Standard safety protocols block all travel into Route 1 without a stabilizing creature.",
            "Kyle: Dr. Aris can assist you in obtaining a starter Force in the lab."
        ],
        allow: [
            "Kyle: Stabilizer creature verified. Sector exit lock released.",
            "Kyle: Be careful in Route 1. Wild field fluctuations are highly volatile."
        ]
    },
    professor: {
        need_starter: [
            "Dr. Aris: Resonator! Spacetime Sector Alpha is collapsing.",
            "Dr. Aris: I have tuned three stable anomalies on the counter. Align with one of them to bind it.",
            "Dr. Aris: They represent Gravity (Graviton), Electromagnetism (Electron), and Entropy (Entropist). Choose wisely!"
        ],
        after_starter: [
            "Dr. Aris: Excellent! That Force is now bound to your Resonance Siphon.",
            "Dr. Aris: The Resonance Node at the northern end of Route 1 has gone offline, destabilizing the sector.",
            "Dr. Aris: Kyle has unlocked the barrier. Walk north, navigate the anomaly fields, and stabilize the Node!"
        ],
        mission_complete: [
            "Dr. Aris: Incredible! Spacetime telemetry shows stabilization in Sector Alpha is complete.",
            "Dr. Aris: You matched the frequencies perfectly. The anomaly is harmonically locked.",
            "Dr. Aris: Congratulations, Resonator. You have saved the outpost!"
        ]
    },
    scientist: {
        info: [
            "Bob: The laws of physics are crumbling out there. Kinetic forces are solidifying.",
            "Bob: Phase changes occur at higher energy states: Solid, Liquid, Plasma.",
            "Bob: Liquid state creatures heal themselves slightly each turn. Keep that in mind during alignments!"
        ]
    },
    node: {
        stabilize: [
            "Resonance Node: [COLLAPSE DETECTED - STABILITY AT 12%]",
            "Resonance Node: Phase sync required. Deactivating electromagnetic force field...",
            "Resonance Node: Synchronize Siphon wave dynamics to stabilize!"
        ],
        stable: [
            "Resonance Node: [STATUS - HARMONIC LOCK ENGAGED - 100%]",
            "Resonance Node: Spacetime vectors stable. Anomalous fluctuations suppressed."
        ]
    }
};

window.TYPE_CHART = ForceBound.TYPE_CHART;
window.FORCE_SPECIES = ForceBound.FORCE_SPECIES;
window.MOVES = ForceBound.MOVES;
window.DIALOGUE_DATABASE = ForceBound.DIALOGUE_DATABASE;

