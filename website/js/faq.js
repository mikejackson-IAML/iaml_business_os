// FAQ Accordion System
// Handles expandable/collapsible FAQ items

function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;
    
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      if (!question) return;
      
      question.addEventListener('click', function() {
        const isActive = item.classList.contains('active');
        
        // Close all other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });
        
        // Toggle current item
        if (isActive) {
          item.classList.remove('active');
        } else {
          item.classList.add('active');
        }
      });
    });
    
    // Open first FAQ by default (optional)
    if (faqItems.length > 0) {
      faqItems[0].classList.add('active');
    }
  }
  
  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', initializeFAQ);