document.addEventListener("DOMContentLoaded", () => {
    let currentIndex = -1; // Force first update
    const slides = [
        document.getElementById('content-0'),
        document.getElementById('content-1'),
        document.getElementById('content-2'),
        document.getElementById('content-3')
    ];

    const sectionObserverOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // Section is active when 50% visible
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const newIndex = parseInt(entry.target.getAttribute('data-section-index'), 10);
                if (newIndex !== currentIndex) {
                    updateSlides(newIndex, currentIndex);
                    
                    // Dispatch event for blob-bg.js to update 3D models
                    const event = new CustomEvent('sectionChanged', { 
                        detail: { index: newIndex } 
                    });
                    window.dispatchEvent(event);
                    
                    currentIndex = newIndex;
                }
            }
        });
    }, sectionObserverOptions);

    const sections = document.querySelectorAll('section[data-section-index]');
    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    function updateSlides(newIndex, oldIndex) {
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
                if (oldIndex !== -1) {
                    if (index < newIndex) {
                        // Scrolling Down: Past slides go up
                        slide.classList.add('-translate-y-24');
                    } else if (index > newIndex) {
                        // Scrolling Up: Future slides go down
                        slide.classList.add('translate-y-24');
                    }
                } else {
                    // Initial load (hide future slides down)
                    if (index > newIndex) {
                        slide.classList.add('translate-y-24');
                    }
                }
            }
        });
    }
});
