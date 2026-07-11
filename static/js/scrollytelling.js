document.addEventListener("DOMContentLoaded", () => {
    let currentIndex = 0;
    const totalSlides = 4;
    let isAnimating = false;
    
    const cards = [
        document.getElementById('card-0'),
        document.getElementById('card-1'),
        document.getElementById('card-2'),
        document.getElementById('card-3')
    ];

    const numberTrack = document.getElementById('section-number-track');
    const accentBar = document.getElementById('accent-bar');

    function updateSlides(newIndex, isInitial = false) {
        if (!isInitial && newIndex === currentIndex) return;
        if (newIndex < 0 || newIndex >= totalSlides) return;
        
        if (!isInitial) isAnimating = true;

        // Trigger top accent bar animation
        if (!isInitial && accentBar) {
            accentBar.style.transform = 'translateY(0)';
            setTimeout(() => {
                accentBar.style.transform = 'translateY(-100%)';
            }, 500);
        }
        
        // Update sliding number track
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

        // Update cards for horizontal 3D Carousel
        cards.forEach((card, index) => {
            if (!card) return;
            const content = card.querySelector('.card-content');
            const offset = index - newIndex;
            
            let translateX = 0;
            let scale = 1;
            let opacity = 1;
            let zIndex = 20;

            if (offset !== 0) {
                // Inactive cards (pushed aside)
                scale = 0.85;
                opacity = 0.4;
                zIndex = 10 - Math.abs(offset);
                
                // Offset calculation (105% of width + some gap)
                translateX = offset * 105; 
                
                // Click to navigate
                card.onclick = () => window.goToSlide(index);
                card.classList.add('cursor-pointer');
                
                if (content) content.style.opacity = '0';
                card.style.pointerEvents = 'auto'; // allow clicking the edge
            } else {
                // Active card (centered)
                translateX = 0;
                scale = 1;
                opacity = 1;
                zIndex = 20;
                
                card.onclick = null;
                card.classList.remove('cursor-pointer');
                
                // Staggered content fade-in
                if (content) {
                    content.style.opacity = '0';
                    setTimeout(() => {
                        content.style.opacity = '1';
                    }, 400); // Wait until mostly slid in
                }
            }

            card.style.transform = `translateX(${translateX}%) scale(${scale})`;
            card.style.opacity = opacity;
            card.style.zIndex = zIndex;
        });

        // Dispatch event for blob-bg.js to update 3D models (optional horizontal parallax)
        const event = new CustomEvent('sectionChanged', { 
            detail: { index: newIndex } 
        });
        window.dispatchEvent(event);

        // Unlock scrolling after transition finishes
        if (!isInitial) {
            setTimeout(() => {
                isAnimating = false;
            }, 800); // 800ms matches card transition duration
        }
    }

    // Expose for onClick
    window.goToSlide = (index) => {
        if (!isAnimating) updateSlides(index);
    };

    // Expose for arrow buttons
    window.prevSlide = () => {
        window.goToSlide(Math.max(0, currentIndex - 1));
    };
    window.nextSlide = () => {
        window.goToSlide(Math.min(totalSlides - 1, currentIndex + 1));
    };

    // Initialize first active dot & slide
    updateSlides(0, true);

    // Wheel Event Listener (Debounced/Throttled)
    window.addEventListener('wheel', (e) => {
        if (isAnimating) return;
        
        if (e.deltaY > 40 || e.deltaX > 40) {
            // Scroll right/down
            window.goToSlide(currentIndex + 1);
        } else if (e.deltaY < -40 || e.deltaX < -40) {
            // Scroll left/up
            window.goToSlide(currentIndex - 1);
        }
    }, { passive: true });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
        if (isAnimating) return;
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowRight') {
            window.goToSlide(currentIndex + 1);
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') {
            window.goToSlide(currentIndex - 1);
        }
    });
});
