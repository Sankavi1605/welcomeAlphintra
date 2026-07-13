// Web Audio API Sound Generator for Premium UI Interactions
class UIAudio {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.unlocked = false;
        
        // Preload the professional real whoosh sound
        this.whooshSound = new Audio('/static/audio/whoosh.mp3');
        this.whooshSound.volume = 0.5;
        this.whooshSound.load();
        
        const unlock = () => {
            if (this.unlocked) return;
            if (this.ctx.state === 'suspended') this.ctx.resume();
            
            // Play a silent buffer to fully unlock iOS/Chrome
            const buffer = this.ctx.createBuffer(1, 1, 22050);
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.ctx.destination);
            source.start(0);
            
            // Unlock HTML5 audio as well
            this.whooshSound.play().then(() => {
                this.whooshSound.pause();
                this.whooshSound.currentTime = 0;
            }).catch(e => {});
            
            this.unlocked = true;
            ['click', 'touchstart', 'keydown'].forEach(e => document.removeEventListener(e, unlock));
        };
        
        ['click', 'touchstart', 'keydown'].forEach(e => document.addEventListener(e, unlock, { once: true }));
    }

    playSlideTransition() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        const duration = 0.5; // Slightly longer to feel "heavy" and elegant
        
        // --- "Air Woosh (Low Pitch)" ---
        // A heavy, elegant glide that removes all high-pitched "whip" or "hiss"
        
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate pseudo-pink noise (which is naturally darker/heavier than white noise)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            let white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        // Strict lowpass filter to remove ALL high-pitched frequencies
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        // Sweep entirely in the low register: 400Hz down to 80Hz
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + duration);
        filter.Q.value = 0.5; // Very smooth, zero resonance/ringing
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        // Slower attack for a "heavy" physical feel
        gain.gain.linearRampToValueAtTime(0.4, now + 0.15); 
        // Long, smooth, elegant fade out
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start(now);
        noise.stop(now + duration);
    }

    playChatOpen() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playChatClose() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }
}

window.uiAudio = new UIAudio();
