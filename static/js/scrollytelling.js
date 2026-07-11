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
    const strips = document.querySelectorAll('.curtain-strip');

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

        if (isInitial || strips.length === 0) {
            // Initial setup or fallback
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
            // Drop staggered curtain strips down to cover screen
            strips.forEach(strip => {
                strip.style.transform = 'translateY(0)';
            });
            
            // Wait for curtain to drop completely (600ms duration + 300ms max delay = 900ms)
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

                // Give DOM a tick, then pull curtain up
                setTimeout(() => {
                    strips.forEach(strip => {
                        strip.style.transform = 'translateY(-100%)';
                    });
                    
                    // Release scrolling lock after curtain finishes rising
                    setTimeout(() => {
                        isAnimating = false;
                    }, 900); 
                }, 50);
            }, 900);
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
