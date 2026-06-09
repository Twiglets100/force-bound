window.ForceBound = window.ForceBound || {};

class SiphonSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.targetWavelength = 100;
        this.targetAmplitude = 40;
        this.userWavelength = 150;
        this.userAmplitude = 10;
        this.startTime = 0;
        this.duration = 5000;
        this.running = false;
        this.onComplete = null;

        this.audioContext = null;
        this.targetOsc = null;
        this.userOsc = null;
        this.targetGain = null;
        this.userGain = null;
    }

    initAudio() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!this.audioContext && AudioContextClass) {
                this.audioContext = new AudioContextClass();
            }
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.targetOsc = this.audioContext.createOscillator();
            this.targetOsc.type = 'sine';
            this.targetGain = this.audioContext.createGain();
            this.targetGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.targetOsc.connect(this.targetGain);
            this.targetGain.connect(this.audioContext.destination);

            this.userOsc = this.audioContext.createOscillator();
            this.userOsc.type = 'sine';
            this.userGain = this.audioContext.createGain();
            this.userGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.userOsc.connect(this.userGain);
            this.userGain.connect(this.audioContext.destination);

            this.targetOsc.start();
            this.userOsc.start();
        } catch (e) {}
    }

    getAccuracyRating() {
        const waveDiff = Math.abs(this.userWavelength - this.targetWavelength);
        const ampDiff = Math.abs(this.userAmplitude - this.targetAmplitude);
        const waveAcc = Math.max(0, 1 - (waveDiff / 80));
        const ampAcc = Math.max(0, 1 - (ampDiff / 45));
        const rating = (waveAcc * 0.6) + (ampAcc * 0.4);
        return rating > 0.93 ? 1.0 : rating;
    }

    updateAudio() {
        if (!this.audioContext) return;
        const t = this.audioContext.currentTime;
        const tFreq = 220 + (80 / this.targetWavelength) * 350;
        const uFreq = 220 + (80 / this.userWavelength) * 350;

        this.targetOsc.frequency.setTargetAtTime(tFreq, t, 0.04);
        this.userOsc.frequency.setTargetAtTime(uFreq, t, 0.04);

        const accuracy = this.getAccuracyRating();
        const targetVol = (this.targetAmplitude / 65) * 0.04;
        const userVol = (this.userAmplitude / 65) * 0.04;
        const coupling = accuracy > 0.85 ? 1.5 : 1.0;

        this.targetGain.gain.setTargetAtTime(targetVol * coupling, t, 0.04);
        this.userGain.gain.setTargetAtTime(userVol * coupling, t, 0.04);
    }

    start(options = {}) {
        this.canvas = document.querySelector(options.canvas);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.duration = options.duration || 5000;
        this.onComplete = options.onComplete || null;

        this.targetWavelength = 45 + Math.random() * 60;
        this.targetAmplitude = 20 + Math.random() * 30;
        this.userWavelength = 120;
        this.userAmplitude = 15;

        this.startTime = Date.now();
        this.running = true;

        if (options.wavelengthSlider) {
            this.wSlider = options.wavelengthSlider;
            this.wSlider.value = this.userWavelength;
            this._wHandler = (e) => { this.userWavelength = parseFloat(e.target.value); this.updateAudio(); };
            this.wSlider.addEventListener('input', this._wHandler);
        }
        if (options.amplitudeSlider) {
            this.aSlider = options.amplitudeSlider;
            this.aSlider.value = this.userAmplitude;
            this._aHandler = (e) => { this.userAmplitude = parseFloat(e.target.value); this.updateAudio(); };
            this.aSlider.addEventListener('input', this._aHandler);
        }

        this.initAudio();
        this.updateAudio();
        requestAnimationFrame(() => this.draw());
    }

    triggerCapture() {
        if (!this.running) return 0;
        const acc = this.getAccuracyRating();
        this.stop();
        if (this.onComplete) this.onComplete(acc);
        return acc;
    }

    stop() {
        if (!this.running) return;
        this.running = false;

        if (this.audioContext) {
            try {
                const t = this.audioContext.currentTime;
                this.targetGain.gain.setTargetAtTime(0, t, 0.02);
                this.userGain.gain.setTargetAtTime(0, t, 0.02);
                const to = this.targetOsc, uo = this.userOsc;
                setTimeout(() => { to.stop(); uo.stop(); }, 50);
            } catch (e) {}
        }

        if (this.wSlider && this._wHandler) this.wSlider.removeEventListener('input', this._wHandler);
        if (this.aSlider && this._aHandler) this.aSlider.removeEventListener('input', this._aHandler);
    }

    draw() {
        if (!this.running || !this.ctx || !this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cy = h / 2;

        this.ctx.fillStyle = 'hsl(230, 25%, 7%)';
        this.ctx.fillRect(0, 0, w, h);

        const elapsed = Date.now() - this.startTime;
        const remaining = Math.max(0, this.duration - elapsed);
        const timeSec = elapsed / 1000;
        const phase = timeSec * 6;

        // Draw Target Green Wave
        this.ctx.strokeStyle = 'rgba(57, 255, 20, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        const tFreq = (Math.PI * 2) / this.targetWavelength;
        for (let x = 0; x < w; x++) {
            const y = cy + this.targetAmplitude * Math.sin(x * tFreq - phase);
            if (x === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();

        // Draw User Cyan Wave
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        const uFreq = (Math.PI * 2) / this.userWavelength;
        for (let x = 0; x < w; x++) {
            const y = cy + this.userAmplitude * Math.sin(x * uFreq - phase);
            if (x === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();

        if (remaining > 0) {
            requestAnimationFrame(() => this.draw());
        } else {
            const acc = this.getAccuracyRating();
            this.stop();
            if (this.onComplete) this.onComplete(acc);
        }
    }
}

ForceBound.SiphonSystem = SiphonSystem;
window.SiphonSystem = ForceBound.SiphonSystem; // Expose globally for backward compatibility
