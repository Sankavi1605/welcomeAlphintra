document.addEventListener("DOMContentLoaded", () => {
    // 1. Intersection Observer for Fade-in Animations
    const animationObserverOptions = {
        root: document.querySelector('main'), // The scrolling container
        rootMargin: '0px',
        threshold: 0.15
    };

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('opacity-0', 'translate-y-12');
                entry.target.classList.add('opacity-100', 'translate-y-0');
            }
        });
    }, animationObserverOptions);

    const elementsToAnimate = document.querySelectorAll('.scroll-fade');
    elementsToAnimate.forEach((el) => {
        el.classList.add('opacity-0', 'translate-y-12', 'transition-all', 'duration-[1200ms]', 'ease-out');
        animationObserver.observe(el);
    });

    // 2. Intersection Observer for Section Tracking (Triggers Blob Movement)
    const sectionObserverOptions = {
        root: document.querySelector('main'),
        rootMargin: '0px',
        threshold: 0.5 // Section is considered active when 50% visible
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionIndex = entry.target.getAttribute('data-section-index');
                if (sectionIndex !== null) {
                    // Dispatch a custom event that blob-bg.js will listen for
                    const event = new CustomEvent('sectionChanged', { 
                        detail: { index: parseInt(sectionIndex, 10) } 
                    });
                    window.dispatchEvent(event);
                }
            }
        });
    }, sectionObserverOptions);

    const sections = document.querySelectorAll('section[data-section-index]');
    sections.forEach(section => {
        sectionObserver.observe(section);
    });
});
