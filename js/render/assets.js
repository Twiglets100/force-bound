window.ForceBound = window.ForceBound || {};

ForceBound.SVGGenerator = {
    generate(species, phaseState = 'Liquid', state = 'idle', width = '100%', height = '100%') {
        if (!species) return '';
        const spec = species.toLowerCase();
        if (this[spec]) {
            return this[spec](phaseState, state, width, height);
        }
        return `<svg viewBox="0 0 100 100" width="${width}" height="${height}">
          <rect x="10" y="10" width="80" height="80" rx="6" fill="none" stroke="hsl(180, 100%, 50%)" stroke-dasharray="4" />
          <text x="50" y="52" fill="hsl(180, 100%, 50%)" font-family="monospace" font-size="6" text-anchor="middle">UNKNOWN ANOMALY</text>
        </svg>`;
    },

    graviton(phaseState = 'Liquid', state = 'idle', width = '100%', height = '100%') {
        const isSolid = phaseState === 'Solid';
        const isPlasma = phaseState === 'Plasma';
        let spinCw = isSolid ? '25s' : isPlasma ? '5s' : '12s';
        let spinCcw = isSolid ? '30s' : isPlasma ? '6s' : '15s';
        let pulse = isSolid ? '4s' : isPlasma ? '0.8s' : '2s';
        let strokeMult = isSolid ? 2.2 : isPlasma ? 0.8 : 1.2;
        
        if (state === 'attacking') {
            spinCw = '2s'; spinCcw = '2.5s'; pulse = '0.4s';
        } else if (state === 'damaged') {
            pulse = '0.1s';
        }

        const core = 'hsl(271, 76%, 53%)';
        const orb1 = 'hsl(271, 76%, 65%)';
        const orb2 = 'hsl(330, 100%, 50%)';

        let extra = '';
        if (isSolid) {
            extra = `<polygon points="50,10 84.6,30 84.6,70 50,90 15.4,70 15.4,30" fill="none" stroke="${core}" stroke-width="2" stroke-dasharray="8 4" style="transform-origin: 50px 50px; animation: grav-spin-cw 40s linear infinite;" />`;
        } else if (isPlasma) {
            extra = `
              <ellipse cx="50" cy="50" rx="42" ry="15" fill="none" stroke="${orb1}" stroke-width="0.8" transform="rotate(30 50 50)" style="transform-origin: 50px 50px; animation: grav-spin-cw ${spinCw} linear infinite;" />
              <ellipse cx="50" cy="50" rx="42" ry="15" fill="none" stroke="${orb2}" stroke-width="0.8" transform="rotate(110 50 50)" style="transform-origin: 50px 50px; animation: grav-spin-ccw ${spinCcw} linear infinite;" />
            `;
        }

        return `
          <svg viewBox="0 0 100 100" width="${width}" height="${height}" style="background: transparent;">
            <defs>
              <radialGradient id="gravGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#000000" />
                <stop offset="60%" stop-color="${core}" stop-opacity="0.9" />
                <stop offset="100%" stop-color="${core}" stop-opacity="0" />
              </radialGradient>
            </defs>
            <style>
              @keyframes grav-spin-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              @keyframes grav-spin-ccw { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
              @keyframes grav-pulse { 0%, 100% { transform: scale(0.92); } 50% { transform: scale(1.08); } }
              .g-cw { transform-origin: 50px 50px; animation: grav-spin-cw ${spinCw} linear infinite; }
              .g-ccw { transform-origin: 50px 50px; animation: grav-spin-ccw ${spinCcw} linear infinite; }
              .g-core { transform-origin: 50px 50px; animation: grav-pulse ${pulse} ease-in-out infinite; }
            </style>
            <g class="${state === 'damaged' ? 'crt-flicker' : ''}">
              <circle cx="50" cy="50" r="36" stroke="${orb1}" stroke-width="${1.5 * strokeMult}" fill="none" stroke-dasharray="12 6" class="g-cw" />
              <circle cx="50" cy="50" r="26" stroke="${orb2}" stroke-width="${1.0 * strokeMult}" fill="none" stroke-dasharray="4 8" class="g-ccw" />
              ${extra}
              <circle cx="50" cy="50" r="14" fill="url(#gravGrad)" class="g-core" />
              <circle cx="50" cy="50" r="6" fill="#000000" class="g-core" />
            </g>
          </svg>
        `;
    },

    electron(phaseState = 'Liquid', state = 'idle', width = '100%', height = '100%') {
        const isSolid = phaseState === 'Solid';
        const isPlasma = phaseState === 'Plasma';
        let orbS1 = isSolid ? '8s' : isPlasma ? '1s' : '3s';
        let orbS2 = isSolid ? '10s' : isPlasma ? '1.2s' : '4s';

        const main = 'hsl(180, 100%, 50%)';
        const spark = '#ffd700';
        const acc = state === 'damaged' ? '#ffaa00' : 'hsl(330, 100%, 50%)';
        
        let core = `
          <path d="M50 22 L46 42 L54 44 L45 62 L55 60 L49 78" stroke="${main}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" class="spark-1" />
          <path d="M50 22 L53 38 L47 45 L52 58 L46 64 L50 78" stroke="${acc}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="spark-2" />
        `;
        if (isSolid) {
            core = `<polygon points="50,35 63,50 50,65 37,50" fill="none" stroke="${main}" stroke-width="2" /><circle cx="50" cy="50" r="5" fill="${spark}" />`;
        }

        return `
          <svg viewBox="0 0 100 100" width="${width}" height="${height}">
            <style>
              @keyframes elec-rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              @keyframes elec-rot-ccw { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
              @keyframes elec-flick-1 { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.2; } }
              @keyframes elec-flick-2 { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.8; } }
              .spark-1 { animation: elec-flick-1 0.15s infinite; }
              .spark-2 { animation: elec-flick-2 0.1s infinite; }
              .o-1 { transform-origin: 50px 50px; animation: elec-rot ${orbS1} linear infinite; }
              .o-2 { transform-origin: 50px 50px; animation: elec-rot-ccw ${orbS2} linear infinite; }
            </style>
            <g class="${state === 'damaged' ? 'crt-flicker' : ''}">
              <g transform="rotate(35 50 50)">
                <ellipse cx="50" cy="50" rx="40" ry="12" stroke="${main}" stroke-width="1" fill="none" opacity="0.5" />
                <circle cx="90" cy="50" r="5" fill="${spark}" class="o-1" />
              </g>
              <g transform="rotate(-35 50 50)">
                <ellipse cx="50" cy="50" rx="38" ry="10" stroke="${acc}" stroke-width="0.8" fill="none" opacity="0.6" />
                <circle cx="88" cy="50" r="4.5" fill="${main}" class="o-2" />
              </g>
              ${core}
            </g>
          </svg>
        `;
    },

    entropist(phaseState = 'Liquid', state = 'idle', width = '100%', height = '100%') {
        const isSolid = phaseState === 'Solid';
        const isPlasma = phaseState === 'Plasma';
        let float1 = isSolid ? '12s' : isPlasma ? '2s' : '5s';
        let float2 = isSolid ? '15s' : isPlasma ? '2.5s' : '6s';

        const main = 'hsl(110, 100%, 54%)';
        const dark = 'hsl(110, 70%, 30%)';
        const acc = state === 'damaged' ? '#b54d13' : 'hsl(180, 100%, 50%)';

        let shapes = `
          <circle cx="50" cy="35" r="10" fill="${main}" opacity="0.8" style="animation: ent-liq-1 ${float1} ease-in-out infinite;" />
          <circle cx="35" cy="55" r="12" fill="${dark}" opacity="0.7" style="animation: ent-liq-2 ${float2} ease-in-out infinite;" />
          <circle cx="68" cy="48" r="9" fill="${acc}" opacity="0.75" style="animation: ent-liq-1 ${float2} ease-in-out infinite;" />
        `;
        if (isSolid) {
            shapes = `
              <polygon points="50,22 62,45 40,42" fill="${main}" opacity="0.8" style="animation: ent-liq-1 ${float1} infinite;" />
              <polygon points="28,52 46,58 36,74" fill="${dark}" opacity="0.7" style="animation: ent-liq-2 ${float2} infinite;" />
            `;
        } else if (isPlasma) {
            shapes = `
              <rect x="45" y="25" width="8" height="8" fill="${main}" style="animation: ent-liq-1 1s infinite;" />
              <rect x="25" y="45" width="6" height="6" fill="${dark}" style="animation: ent-liq-2 1.2s infinite;" />
              <rect x="65" y="40" width="7" height="7" fill="${acc}" style="animation: ent-liq-1 1.4s infinite;" />
            `;
        }

        return `
          <svg viewBox="0 0 100 100" width="${width}" height="${height}">
            <style>
              @keyframes ent-liq-1 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(4px, -4px) scale(1.1); } }
              @keyframes ent-liq-2 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-4px, 4px) scale(0.9); } }
            </style>
            <g class="${state === 'damaged' ? 'crt-flicker' : ''}">
              ${shapes}
            </g>
          </svg>
        `;
    },

    photon(phaseState = 'Liquid', state = 'idle', width = '100%', height = '100%') {
        const pink = 'hsl(330, 100%, 50%)';
        const cyan = 'hsl(180, 100%, 50%)';
        const acc = state === 'damaged' ? '#b51c1c' : '#ffffff';
        
        return `
          <svg viewBox="0 0 100 100" width="${width}" height="${height}">
            <style>
              @keyframes phot-w1 { 0% { stroke-dashoffset: 40; } 100% { stroke-dashoffset: 0; } }
              @keyframes phot-pulse { 0%, 100% { transform: scale(0.9); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } }
              .p-w { animation: phot-w1 2.5s linear infinite; }
              .p-core { transform-origin: 50px 50px; animation: phot-pulse 1.8s ease-in-out infinite; }
            </style>
            <g class="${state === 'damaged' ? 'crt-flicker' : ''}">
              <path d="M 10 50 Q 22 50 28 50 Q 34 42 40 58 Q 46 25 52 75 Q 58 25 64 75 Q 70 42 76 58 Q 82 50 90 50" stroke="${cyan}" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="15 5" class="p-w" />
              <circle cx="50" cy="50" r="14" fill="${pink}" opacity="0.4" class="p-core" />
              <circle cx="50" cy="50" r="6" fill="${acc}" class="p-core" />
            </g>
          </svg>
        `;
    },

    tachyon(phaseState = 'Liquid', state = 'idle', width = '100%', height = '100%') {
        const cyan = 'hsl(180, 100%, 50%)';
        const pink = 'hsl(330, 100%, 50%)';
        const acc = state === 'damaged' ? '#d9534f' : '#ffffff';

        return `
          <svg viewBox="0 0 100 100" width="${width}" height="${height}">
            <style>
              @keyframes tach-st { 0% { stroke-dashoffset: 150; } 100% { stroke-dashoffset: 0; } }
              @keyframes tach-p { 0%, 100% { transform: scale(0.95) translate(-2px, 0); } 50% { transform: scale(1.05) translate(2px, 0); } }
              .t-s { animation: tach-st 0.9s linear infinite; }
              .t-g { transform-origin: 50px 50px; animation: tach-p 1.2s ease-in-out infinite; }
            </style>
            <g class="${state === 'damaged' ? 'crt-flicker' : ''}">
              <g class="t-g">
                <path d="M5,50 H95" stroke="${cyan}" stroke-width="1.5" stroke-dasharray="30 15" class="t-s" />
                <path d="M15,42 H85" stroke="${pink}" stroke-width="1.0" stroke-dasharray="20 20" class="t-s" />
                <polygon points="65,35 90,50 65,65 55,50" fill="${acc}" />
              </g>
            </g>
          </svg>
        `;
    },

    quark(phaseState = 'Liquid', state = 'idle', width = '100%', height = '100%') {
        const red = 'hsl(330, 100%, 50%)';
        const cyan = 'hsl(180, 100%, 50%)';
        const green = 'hsl(110, 100%, 54%)';
        const acc = state === 'damaged' ? '#555555' : '#ffffff';
        let n1 = { x: 50, y: 26 }, n2 = { x: 72, y: 64 }, n3 = { x: 28, y: 64 };

        return `
          <svg viewBox="0 0 100 100" width="${width}" height="${height}">
            <style>
              @keyframes q-vib-1 { 0% { transform: translate(-1px, 1px); } 100% { transform: translate(1px, -1px); } }
              @keyframes q-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              .q-group { transform-origin: 50px 50px; animation: q-spin 3s linear infinite; }
              .n1 { animation: q-vib-1 0.12s infinite alternate; }
            </style>
            <g class="${state === 'damaged' ? 'crt-flicker' : ''} q-group">
              <line x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}" stroke="${green}" stroke-width="2" stroke-dasharray="3 3" />
              <line x1="${n2.x}" y1="${n2.y}" x2="${n3.x}" y2="${n3.y}" stroke="${red}" stroke-width="2" stroke-dasharray="3 3" />
              <line x1="${n3.x}" y1="${n3.y}" x2="${n1.x}" y2="${n1.y}" stroke="${cyan}" stroke-width="2" stroke-dasharray="3 3" />
              
              <circle cx="${n1.x}" cy="${n1.y}" r="6" fill="${red}" class="n1" />
              <circle cx="${n2.x}" cy="${n2.y}" r="6" fill="${cyan}" class="n1" />
              <circle cx="${n3.x}" cy="${n3.y}" r="6" fill="${green}" class="n1" />
            </g>
          </svg>
        `;
    }
};
