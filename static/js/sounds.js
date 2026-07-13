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
        // Scrolling sound effect removed as requested
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
