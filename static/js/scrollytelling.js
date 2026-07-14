document.addEventListener("DOMContentLoaded", () => {
    let currentIndex = 0;
    const slides = Array.from(document.querySelectorAll('.kiosk-slide'));
    const totalSlides = slides.length;
    let isAnimating = false;

    const numberTrack = document.getElementById('section-number-track');

    function updateNumberTrack(newIndex) {
        if (!numberTrack) return;
        numberTrack.style.transform = `translateY(-${newIndex * 25}%)`;
        Array.from(numberTrack.children).forEach((child, i) => {
            child.style.color = i === newIndex ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)';
            if(i === newIndex) {
                child.style.transform = 'scale(1.1)';
            } else {
                child.style.transform = 'scale(1.0)';
            }
        });
    }

    function updateSlides(newIndex, isInitial = false) {
        if (!isInitial && newIndex === currentIndex) return;
        if (newIndex < 0 || newIndex >= totalSlides) return;

        if (!isInitial) isAnimating = true;

        slides.forEach((slide, index) => {
            if (!slide) return;
            if (isInitial) {
                slide.style.transitionDuration = '0ms';
            } else {
                slide.style.transitionDuration = '600ms';
            }

            slide.classList.remove('hidden-prev', 'hidden-next', 'active-slide');

            if (index < newIndex) {
                slide.classList.add('hidden-prev'); // scrolled past it
            } else if (index > newIndex) {
                slide.classList.add('hidden-next'); // haven't reached it
            } else {
                slide.classList.add('active-slide'); // current
            }
        });

        currentIndex = newIndex;
        updateNumberTrack(newIndex);
        window.dispatchEvent(new CustomEvent('sectionChanged', { detail: { index: newIndex } }));

        if (!isInitial) {
            if (window.uiAudio) window.uiAudio.playSlideTransition();
            setTimeout(() => {
                isAnimating = false;
            }, 800); // 0.6s CSS transition + 200ms cooldown to block trackpad inertia
        }
    }

    // Expose for nav button onClick handlers
    window.goToSlide = (index) => {
        if (!isAnimating) updateSlides(index);
    };

    // Initialize first slide
    updateSlides(0, true);
    setTimeout(() => {
        slides.forEach(s => s && (s.style.transitionDuration = '600ms'));
    }, 50);

    // Touch swipe navigation
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', (e) => {
        if (isAnimating) return;
        const currentSlide = slides[currentIndex];
        if (!currentSlide) return;

        const dy = touchStartY - e.changedTouches[0].clientY;
        const isAtTop = currentSlide.scrollTop <= 50;
        const isAtBottom = Math.ceil(currentSlide.scrollTop + currentSlide.clientHeight) >= currentSlide.scrollHeight - 50;

        if (dy > 30 && isAtBottom)       window.goToSlide(currentIndex + 1);
        else if (dy < -30 && isAtTop)    window.goToSlide(currentIndex - 1);
    }, { passive: true });

    // Mouse wheel navigation
    window.addEventListener('wheel', (e) => {
        if (isAnimating) return;
        const currentSlide = slides[currentIndex];
        if (!currentSlide) return;

        const isAtTop = currentSlide.scrollTop <= 50;
        const isAtBottom = Math.ceil(currentSlide.scrollTop + currentSlide.clientHeight) >= currentSlide.scrollHeight - 50;

        if (e.deltaY > 15 && isAtBottom)       window.goToSlide(currentIndex + 1);
        else if (e.deltaY < -15 && isAtTop)    window.goToSlide(currentIndex - 1);
    }, { passive: true });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
        if (isAnimating) return;
        if (e.key === 'ArrowDown' || e.key === 'PageDown') window.goToSlide(currentIndex + 1);
        if (e.key === 'ArrowUp'   || e.key === 'PageUp')   window.goToSlide(currentIndex - 1);
    });
});

