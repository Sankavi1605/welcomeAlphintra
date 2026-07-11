document.addEventListener("DOMContentLoaded", () => {
    let currentIndex = 0;
    const totalSlides = 4;
    let isAnimating = false;
    
    const slides = [
        document.getElementById('content-0'),
        document.getElementById('content-1'),
        document.getElementById('content-2'),
        document.getElementById('content-3')
    ];

    const dots = [
        document.getElementById('nav-dot-0'),
        document.getElementById('nav-dot-1'),
        document.getElementById('nav-dot-2'),
        document.getElementById('nav-dot-3')
    ];

    function updateSlides(newIndex, isInitial = false) {
        if (!isInitial && newIndex === currentIndex) return;
        if (newIndex < 0 || newIndex >= totalSlides) return;
        
        if (!isInitial) isAnimating = true;
        
        // Update dots
        dots.forEach((dot, i) => {
            if (!dot) return;
            if (i === newIndex) {
                dot.classList.remove('text-white/30');
                dot.classList.add('text-white', 'scale-110');
            } else {
                dot.classList.add('text-white/30');
                dot.classList.remove('text-white', 'scale-110');
            }
        });

        const oldIndex = currentIndex;
        currentIndex = newIndex;

        slides.forEach((slide, index) => {
            if (!slide) return;
            
            if (index === newIndex) {
                // Incoming Slide
                slide.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-24', 'translate-y-24');
                // Ensure it transitions into place
                requestAnimationFrame(() => {
                    slide.classList.add('opacity-100', 'translate-y-0');
                    slide.classList.remove('pointer-events-none');
                });
            } else {
                // Outgoing Slide
                slide.classList.remove('opacity-100', 'translate-y-0');
                slide.classList.add('opacity-0', 'pointer-events-none');
                
                // Determine direction based on scroll
                if (index < newIndex) {
                    // Scrolling Down: Past slides go up
                    slide.classList.add('-translate-y-24');
                } else if (index > newIndex) {
                    // Scrolling Up: Future slides go down
                    slide.classList.add('translate-y-24');
                }
            }
        });

        // Dispatch event for blob-bg.js to update 3D models
        const event = new CustomEvent('sectionChanged', { 
            detail: { index: newIndex } 
        });
        window.dispatchEvent(event);

        // Unlock scrolling after transition finishes
        if (!isInitial) {
            setTimeout(() => {
                isAnimating = false;
            }, 1200); // 1.2s matches CSS transition duration
        }
    }

    // Expose for onClick
    window.goToSlide = (index) => {
        if (!isAnimating) updateSlides(index);
    };

    // Initialize first active dot & slide
    updateSlides(0, true);

    // Wheel Event Listener (Debounced/Throttled)
    window.addEventListener('wheel', (e) => {
        if (isAnimating) return;
        
        if (e.deltaY > 40) {
            // Scroll down
            window.goToSlide(currentIndex + 1);
        } else if (e.deltaY < -40) {
            // Scroll up
            window.goToSlide(currentIndex - 1);
        }
    }, { passive: true });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
        if (isAnimating) return;
        if (e.key === 'ArrowDown' || e.key === 'PageDown') {
            window.goToSlide(currentIndex + 1);
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            window.goToSlide(currentIndex - 1);
        }
    });
});
