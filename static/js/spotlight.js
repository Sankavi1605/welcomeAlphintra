document.addEventListener("DOMContentLoaded", () => {
    const section = document.getElementById("spotlight-section");
    const revealLayer = document.getElementById("reveal-layer");
    
    if (!section || !revealLayer) return;

    const SPOTLIGHT_R = 260;
    
    let targetX = -999;
    let targetY = -999;
    let currentX = -999;
    let currentY = -999;
    
    // Set initial mask state
    updateMask(currentX, currentY);

    section.addEventListener("mousemove", (e) => {
        const rect = section.getBoundingClientRect();
        targetX = e.clientX - rect.left;
        targetY = e.clientY - rect.top;
    });

    function updateMask(x, y) {
        // Build radial gradient mask
        const maskStr = `radial-gradient(circle ${SPOTLIGHT_R}px at ${x}px ${y}px, 
            rgba(255,255,255,1) 0%, 
            rgba(255,255,255,1) 40%, 
            rgba(255,255,255,0.75) 60%, 
            rgba(255,255,255,0.4) 75%, 
            rgba(255,255,255,0.12) 88%, 
            rgba(255,255,255,0) 100%)`;
        
        revealLayer.style.webkitMaskImage = maskStr;
        revealLayer.style.maskImage = maskStr;
        revealLayer.style.webkitMaskSize = "100% 100%";
        revealLayer.style.maskSize = "100% 100%";
    }

    function animate() {
        // Lerp for smooth trailing effect
        if (targetX !== -999 && currentX === -999) {
            currentX = targetX;
            currentY = targetY;
        } else if (targetX !== -999) {
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;
        }
        
        updateMask(currentX, currentY);
        requestAnimationFrame(animate);
    }

    animate();
});
