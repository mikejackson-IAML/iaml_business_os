// Animation Systems - Scroll triggers, reveal effects, timeline animations
// Handles all animation logic across the site

// ===== REVEAL ON SCROLL OBSERVER =====
function initializeRevealObserver() {
    const items = document.querySelectorAll('.reveal:not(.in-view)');
    if (!items.length) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      items.forEach(i => i.classList.add('in-view'));
      return;
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { 
      threshold: 0.18, 
      rootMargin: '0px 0px -8%' 
    });
    
    items.forEach(item => observer.observe(item));
  }
  
  // ===== TIMELINE ANIMATION (Sequential Typewriter) =====
  function initializeTimelineAnimation() {
    const timelineSteps = document.querySelectorAll('.timeline-step');
    if (!timelineSteps.length) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      timelineSteps.forEach(step => step.classList.add('animate-in'));
      return;
    }
    
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          timelineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    
    timelineSteps.forEach(step => timelineObserver.observe(step));
  }
  
  // ===== CIRCLE ANIMATION (Quiz Section) =====
  function startCircleSequence() {
    const circleContainer = document.getElementById('circleContainer');
    const circleText = document.getElementById('circleText');
    const circleSubtext = document.getElementById('circleSubtext');
    const quizContainer = document.getElementById('quizContainer');
    const quizLeft = document.getElementById('quizLeft');
    const ring1 = document.getElementById('ring1');
    const ring2 = document.getElementById('ring2');
    const ring3 = document.getElementById('ring3');
    
    if (!circleContainer) return;
    
    // Show container
    setTimeout(() => {
      circleContainer.classList.add('visible');
    }, 200);
    
    // Trigger expanding rings periodically
    if (ring1) setTimeout(() => ring1.classList.add('animate'), 1000);
    if (ring2) setTimeout(() => ring2.classList.add('animate'), 1500);
    if (ring3) setTimeout(() => ring3.classList.add('animate'), 2000);
    
    // Fade in text with upward slide
    setTimeout(() => {
      if (circleText) {
        circleText.classList.add('visible');
        setTimeout(() => {
          if (circleSubtext) circleSubtext.classList.add('visible');
        }, 500);
      }
    }, 800);
    
    // Expand circle and reveal BOTH left content AND quiz simultaneously
    setTimeout(() => {
      circleContainer.classList.add('expanding');
      setTimeout(() => {
        circleContainer.style.display = 'none';
        // Reveal both sides at the same time
        if (quizLeft) quizLeft.classList.add('revealed');
        if (quizContainer) {
          quizContainer.classList.add('revealed');
          quizContainer.style.display = 'flex';
          // Initialize quiz to display questions and options
          if (typeof initQuiz === 'function') {
            initQuiz();
          }
        }
      }, 1000);
    }, 5000);
  }
  
  // ===== 3D HEADLINE FLIP ANIMATION =====
  function initialize3DHeadlineAnimation() {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add animate-in class when element comes into view
          entry.target.classList.add('animate-in');
          
          // If this is the headline, also trigger subtext and button
          if (entry.target.classList.contains('hero-headline-3d')) {
            const heroSubtext = document.querySelector('.hero-subtext-animated');
            const heroButton = document.querySelector('.btn-animated');
            if (heroSubtext) heroSubtext.classList.add('animate-in');
            if (heroButton) heroButton.classList.add('animate-in');
            
            // Show testimonials slightly after button animation completes
            const testimonialSection = document.querySelector('.hero-testimonial-section');
            if (testimonialSection) {
              setTimeout(() => {
                testimonialSection.classList.add('show');
              }, 5000);
            }
          }
          
          // Stop observing after animation triggers once
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    // Observe the headline
    const heroHeadline = document.querySelector('.hero-headline-3d');
    if (heroHeadline) {
      observer.observe(heroHeadline);
    }
  }
  
  // ===== PRESIDENT'S MESSAGE TYPEWRITER =====
  function initializePresidentMessage() {
    const presidentContainer = document.getElementById('typewriter-content');
    const signature = document.getElementById('signature');
    
    if (!presidentContainer || !signature) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
      const paragraphs = presidentContainer.querySelectorAll('p');
      
      // Use IntersectionObserver for reliable fade-in animation
      const presidentObserverOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px'
      };
      
      const presidentObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index'));
            
            // Stagger the animation based on index
            setTimeout(() => {
              entry.target.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            }, index * 100);
            
            // Unobserve after animation starts
            presidentObserver.unobserve(entry.target);
          }
        });
      }, presidentObserverOptions);
      
      // Observe all paragraphs
      paragraphs.forEach(p => presidentObserver.observe(p));
      
      // Observer for signature
      const signatureObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              signature.classList.add('visible');
            }, 300);
            signatureObserver.disconnect();
          }
        });
      }, { threshold: 0.2 });
      
      signatureObserver.observe(signature);
    } else {
      // Show everything immediately for reduced motion preference
      presidentContainer.querySelectorAll('p').forEach(p => {
        p.style.opacity = '1';
        p.style.transform = 'translateY(0)';
      });
      signature.classList.add('visible');
    }
  }
  
  // ===== SMOOTH SCROLL TO ANCHOR =====
  function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
  
  // ===== INITIALIZE ALL ANIMATIONS =====
  function initializeAllAnimations() {
    initializeRevealObserver();
    initializeTimelineAnimation();
    initialize3DHeadlineAnimation();
    initializePresidentMessage();
    initializeSmoothScroll();
    
    // Initialize circle animation for quiz section
    const quizContent = document.getElementById('quizContent');
    if (quizContent) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            startCircleSequence();
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      
      observer.observe(quizContent);
    }
  }
  
  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', initializeAllAnimations);
  
  // Export functions for external use
  if (typeof window !== 'undefined') {
    window.startCircleSequence = startCircleSequence;
    window.initializeAllAnimations = initializeAllAnimations;
  }