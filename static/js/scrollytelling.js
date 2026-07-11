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

    const numberTrack = document.getElementById('section-number-track');
    const curtain = document.getElementById('page-curtain');

    function updateSlides(newIndex, isInitial = false) {
        if (!isInitial && newIndex === currentIndex) return;
        if (newIndex < 0 || newIndex >= totalSlides) return;
        
        if (!isInitial) isAnimating = true;
        
        // Update sliding number track immediately
        if (numberTrack) {
            numberTrack.style.transform = `translateY(-${newIndex * 25}%)`;
            
            const children = Array.from(numberTrack.children);
            children.forEach((child, i) => {
                if (i === newIndex) {
                    child.classList.remove('text-white/30');
                    child.classList.add('text-white', 'scale-110');
                } else {
                    child.classList.add('text-white/30');
                    child.classList.remove('text-white', 'scale-110');
                }
            });
        }

        const oldIndex = currentIndex;
        currentIndex = newIndex;

        if (isInitial || !curtain) {
            // Initial setup or fallback: no curtain
            slides.forEach((slide, index) => {
                if (!slide) return;
                slide.style.transitionDuration = '0ms'; // Disable CSS transitions for instant swap
                if (index === newIndex) {
                    slide.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-24', 'translate-y-24');
                    slide.classList.add('opacity-100', 'translate-y-0');
                } else {
                    slide.classList.remove('opacity-100', 'translate-y-0');
                    slide.classList.add('opacity-0', 'pointer-events-none');
                }
            });
            const event = new CustomEvent('sectionChanged', { detail: { index: newIndex } });
            window.dispatchEvent(event);
        } else {
            // Step 1: Drop curtain down to cover screen
            curtain.style.transitionDuration = '700ms';
            curtain.style.transform = 'translateY(0)';
            
            // Wait for curtain to drop, then swap content instantly
            setTimeout(() => {
                slides.forEach((slide, index) => {
                    if (!slide) return;
                    // Ensure slides swap instantly while covered
                    slide.style.transitionDuration = '0ms'; 
                    
                    if (index === newIndex) {
                        slide.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-24', 'translate-y-24');
                        slide.classList.add('opacity-100', 'translate-y-0');
                    } else {
                        slide.classList.remove('opacity-100', 'translate-y-0');
                        slide.classList.add('opacity-0', 'pointer-events-none');
                    }
                });

                // Update background 3D models while covered
                const event = new CustomEvent('sectionChanged', { detail: { index: newIndex } });
                window.dispatchEvent(event);

                // Give DOM a tick, then continue curtain downward to 100%
                setTimeout(() => {
                    curtain.style.transform = 'translateY(100%)';
                    
                    // Wait for curtain to exit at the bottom
                    setTimeout(() => {
                        // Disable transition to jump instantly without animating
                        curtain.style.transitionDuration = '0ms';
                        curtain.style.transform = 'translateY(-100%)';
                        
                        // Force a reflow so the browser registers the instant jump
                        void curtain.offsetHeight;
                        
                        // Restore transition duration for next time
                        curtain.style.transitionDuration = '700ms';
                        
                        isAnimating = false;
                    }, 700); // Wait for transition duration of curtain
                }, 50);
            }, 700); // Match curtain transition duration in HTML (700ms)
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
            window.goToSlide(currentIndex + 1);
        } else if (e.deltaY < -40) {
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
