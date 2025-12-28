/**
 * Curriculum Section - Tab Navigation and Accordion
 * Handles block switching and competency group expansion
 */

const initCurriculum = () => {
  // Get all tab navigation cards and content blocks
  const navCards = document.querySelectorAll('.curriculum-nav-card');
  const contentBlocks = document.querySelectorAll('.curriculum-block');
  const competencyHeaders = document.querySelectorAll('.competency-header');

  // Initialize tab switching
  if (navCards.length > 0) {
    navCards.forEach(card => {
      card.addEventListener('click', () => {
        handleTabSwitch(card, navCards, contentBlocks);
      });

      // Keyboard support: Enter and Space
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTabSwitch(card, navCards, contentBlocks);
        }
      });
    });

    // Set first tab as focusable
    navCards[0].setAttribute('tabindex', '0');
    navCards.forEach((card, index) => {
      if (index > 0) {
        card.setAttribute('tabindex', '-1');
      }
    });

    // Arrow key navigation between tabs
    navCards.forEach((card) => {
      card.addEventListener('keydown', (e) => {
        let targetCard = null;
        const currentIndex = Array.from(navCards).indexOf(card);

        if (e.key === 'ArrowRight') {
          e.preventDefault();
          targetCard = navCards[Math.min(currentIndex + 1, navCards.length - 1)];
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          targetCard = navCards[Math.max(currentIndex - 1, 0)];
        }

        if (targetCard) {
          targetCard.focus();
          handleTabSwitch(targetCard, navCards, contentBlocks);
        }
      });
    });
  }

  // Initialize step tabs footer navigation
  const stepTabs = document.querySelectorAll('.curriculum-step-tab');

  if (stepTabs.length > 0) {
    stepTabs.forEach(tab => {
      // Click handler
      tab.addEventListener('click', () => {
        handleTabSwitch(tab, navCards, contentBlocks);
      });

      // Keyboard support: Enter and Space
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTabSwitch(tab, navCards, contentBlocks);
        }
      });
    });

    // Arrow key navigation between step tabs
    stepTabs.forEach((tab) => {
      tab.addEventListener('keydown', (e) => {
        let targetTab = null;
        const currentIndex = Array.from(stepTabs).indexOf(tab);

        if (e.key === 'ArrowRight') {
          e.preventDefault();
          targetTab = stepTabs[Math.min(currentIndex + 1, stepTabs.length - 1)];
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          targetTab = stepTabs[Math.max(currentIndex - 1, 0)];
        }

        if (targetTab) {
          targetTab.focus();
          handleTabSwitch(targetTab, navCards, contentBlocks);

          // Scroll tab into view on mobile
          targetTab.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      });
    });
  }

  // Initialize accordion
  if (competencyHeaders.length > 0) {
    competencyHeaders.forEach(header => {
      header.addEventListener('click', () => {
        handleAccordionToggle(header);
      });

      // Keyboard support: Enter and Space
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleAccordionToggle(header);
        }
      });

      // Set initial aria-expanded state
      const group = header.closest('.competency-group');
      const isActive = group.classList.contains('active');
      header.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });
  }
};

/**
 * Handle tab/block switching
 */
const handleTabSwitch = (clickedCard, allCards, allBlocks) => {
  const targetBlockId = clickedCard.getAttribute('data-target');

  if (!targetBlockId) return;

  // Remove active state from all cards
  allCards.forEach(card => {
    card.classList.remove('active');
    card.setAttribute('tabindex', '-1');
    card.setAttribute('aria-selected', 'false');
  });

  // Add active state to clicked card
  clickedCard.classList.add('active');
  clickedCard.setAttribute('tabindex', '0');
  clickedCard.setAttribute('aria-selected', 'true');

  // Hide all blocks
  allBlocks.forEach(block => {
    block.classList.remove('active');
  });

  // Show target block
  const targetBlock = document.getElementById(targetBlockId);
  if (targetBlock) {
    targetBlock.classList.add('active');

    // Announce change to screen readers
    announceToScreenReader(`${clickedCard.textContent} tab activated`);

    // Scroll to top of curriculum section smoothly
    const curriculumSection = document.querySelector('.curriculum-section');
    if (curriculumSection) {
      curriculumSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Sync state across all navigation elements
  // Update navigation cards (top)
  const allNavCards = document.querySelectorAll('.curriculum-nav-card');
  allNavCards.forEach(navCard => {
    const navTarget = navCard.getAttribute('data-target');
    if (navTarget === targetBlockId) {
      navCard.classList.add('active');
      navCard.setAttribute('tabindex', '0');
      navCard.setAttribute('aria-selected', 'true');
    } else {
      navCard.classList.remove('active');
      navCard.setAttribute('tabindex', '-1');
      navCard.setAttribute('aria-selected', 'false');
    }
  });

  // Update step tabs (footer)
  const allStepTabs = document.querySelectorAll('.curriculum-step-tab');
  allStepTabs.forEach(stepTab => {
    const stepTarget = stepTab.getAttribute('data-target');
    if (stepTarget === targetBlockId) {
      stepTab.classList.add('active');
      stepTab.setAttribute('tabindex', '0');
      stepTab.setAttribute('aria-selected', 'true');
    } else {
      stepTab.classList.remove('active');
      stepTab.setAttribute('tabindex', '-1');
      stepTab.setAttribute('aria-selected', 'false');
    }
  });
};

/**
 * Handle accordion toggle (competency groups)
 */
const handleAccordionToggle = (header) => {
  const group = header.closest('.competency-group');
  if (!group) return;

  const isCurrentlyActive = group.classList.contains('active');

  // Toggle current group
  group.classList.toggle('active');

  // Update aria-expanded
  header.setAttribute('aria-expanded', !isCurrentlyActive);

  // Announce change to screen readers
  const groupTitle = header.querySelector('h3')?.textContent || 'Group';
  const action = isCurrentlyActive ? 'collapsed' : 'expanded';
  announceToScreenReader(`${groupTitle} ${action}`);
};

/**
 * Announce changes to screen readers using aria-live
 */
const announceToScreenReader = (message) => {
  let liveRegion = document.querySelector('[aria-live="polite"]');

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  }

  liveRegion.textContent = message;
};

/**
 * Initialize "Next Block" CTA buttons
 */
const initNextBlockButtons = () => {
  const nextBlockButtons = document.querySelectorAll('.curriculum-next-block-btn');

  nextBlockButtons.forEach(button => {
    button.addEventListener('click', () => {
      const nextBlockId = button.getAttribute('data-next-block');
      const targetCard = document.querySelector(`[data-target="${nextBlockId}"]`);

      if (targetCard) {
        const allCards = document.querySelectorAll('.curriculum-nav-card');
        const allBlocks = document.querySelectorAll('.curriculum-block');

        // Use existing handleTabSwitch function
        handleTabSwitch(targetCard, allCards, allBlocks);

        // Scroll to top of curriculum section smoothly
        const curriculumSection = document.querySelector('.curriculum-section');
        if (curriculumSection) {
          curriculumSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initCurriculum();
  initNextBlockButtons();
});
