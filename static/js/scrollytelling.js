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
    const CURTAIN_DURATION = 600; // ms — matches CSS transition duration

    function swapContent(newIndex) {
        slides.forEach((slide, index) => {
            if (!slide) return;
            slide.style.transitionDuration = '0ms'; // instant swap — hidden under curtain
            if (index === newIndex) {
                slide.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-24', 'translate-y-24');
                slide.classList.add('opacity-100', 'translate-y-0');
            } else {
                slide.classList.remove('opacity-100', 'translate-y-0');
                slide.classList.add('opacity-0', 'pointer-events-none');
            }
        });

        // Fire blob / 3D background update
        window.dispatchEvent(new CustomEvent('sectionChanged', { detail: { index: newIndex } }));
    }

    function updateNumberTrack(newIndex) {
        if (!numberTrack) return;
        numberTrack.style.transform = `translateY(-${newIndex * 25}%)`;
        Array.from(numberTrack.children).forEach((child, i) => {
            if (i === newIndex) {
                child.classList.remove('text-white/30');
                child.classList.add('text-white', 'scale-110');
            } else {
                child.classList.add('text-white/30');
                child.classList.remove('text-white', 'scale-110');
            }
        });
    }

    function updateSlides(newIndex, isInitial = false) {
        if (!isInitial && newIndex === currentIndex) return;
        if (newIndex < 0 || newIndex >= totalSlides) return;

        currentIndex = newIndex;
        updateNumberTrack(newIndex);

        if (isInitial || !curtain) {
            // No animation on first load
            swapContent(newIndex);
            return;
        }

        isAnimating = true;

        // STEP 1 — Drop curtain down (translateY(-100%) → translateY(0))
        curtain.classList.remove('exit');
        curtain.classList.add('active');

        // STEP 2 — At transition end, swap content then trigger exit
        curtain.addEventListener('transitionend', function onCurtainIn() {
            curtain.removeEventListener('transitionend', onCurtainIn);

            // Swap content while fully covered
            swapContent(newIndex);

            // Small tick so browser registers the state before animating out
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // STEP 3 — Exit curtain downward (translateY(0) → translateY(100%))
                    curtain.classList.remove('active');
                    curtain.classList.add('exit');

                    curtain.addEventListener('transitionend', function onCurtainOut() {
                        curtain.removeEventListener('transitionend', onCurtainOut);

                        // STEP 4 — Reset instantly to top without animation
                        curtain.style.transition = 'none';
                        curtain.classList.remove('exit');
                        // Force reflow
                        void curtain.offsetHeight;
                        // Restore transition for next run
                        curtain.style.transition = '';

                        isAnimating = false;
                    });
                });
            });
        });
    }

    // Expose for nav button onClick handlers
    window.goToSlide = (index) => {
        if (!isAnimating) updateSlides(index);
    };

    // Initialize first slide without animation
    updateSlides(0, true);

    // Mouse wheel navigation
    window.addEventListener('wheel', (e) => {
        if (isAnimating) return;
        if (e.deltaY > 40)       window.goToSlide(currentIndex + 1);
        else if (e.deltaY < -40) window.goToSlide(currentIndex - 1);
    }, { passive: true });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
        if (isAnimating) return;
        if (e.key === 'ArrowDown' || e.key === 'PageDown') window.goToSlide(currentIndex + 1);
        if (e.key === 'ArrowUp'   || e.key === 'PageUp')   window.goToSlide(currentIndex - 1);
    });
});
