// Testimonials Carousel - Splide.js powered slider
// Used on homepage testimonials section

const testimonialsData = [
    {
      "quote": "The information was extremely valuable and interesting, I learned a great deal. The instructors did an exceptional job presenting; they were helpful, knowledgeable and entertaining.",
      "name": "Katie Sanders",
      "title": "Coordinator of Workforce Development",
      "company": "Northside Hospital"
    },
    {
      "quote": "The best training seminar I've attended! Very valuable to what I do every day, especially in reviewing litigation cases. There was much value in the interaction with other HR peers.",
      "name": "Jennifer Capozziello",
      "title": "AVP, Human Resources",
      "company": "Travelers"
    },
    {
      "quote": "I thought the seminar was very informative! I will definitely utilize my new skills I have acquired during the training. I would highly recommend others to use IAML as their training/learning tool.",
      "name": "Stephanie Banach",
      "title": "Shareholder Relations Manager",
      "company": "Akhiok-Kaguyak, Inc."
    },
    {
      "quote": "This was my first seminar with IAML and I was very impressed! The speakers were great and the sessions were very informative. I will definitely attend again!",
      "name": "Holly Dean",
      "title": "Employment Manager",
      "company": "Alfa Insurance Company"
    },
    {
      "quote": "The classroom participation was excellent and allowed us to share situations and get other perspectives in a safe space. This was the best employee relations seminar that I've ever attended.",
      "name": "JoAnne Guerrant",
      "title": "Employee Relations Manager",
      "company": "Delta Community Credit Union"
    },
    {
      "quote": "I thoroughly enjoyed the seminar. Thank you for so much valuable information and for great case examples.",
      "name": "Amelia Gowdy",
      "title": "Human Resources Business Associate",
      "company": "Miami-Dade County Housing Finance Authority"
    },
    {
      "quote": "It's always good to come back to IAML to get updated on the newest rulings as well as to refresh my knowledge of employment law. The instructors were very good and their presentation skills were excellent.",
      "name": "Denise Teuscher",
      "title": "Lead Labor Relations Specialist",
      "company": "Battelle Energy Alliance"
    },
    {
      "quote": "Thank you for all of the information that was given. I am very excited to apply the knowledge that has been given. I would very much like to continue to work with the IAML team to continue my education.",
      "name": "David Deem",
      "title": "Continuous Improvement Manager",
      "company": "Lear Corporation"
    },
    {
      "quote": "This was my third IAML seminar and I have been very impressed each time. The information is comprehensive, in-depth, and very relevant. I plan to attend more IAML seminars in the future.",
      "name": "Gloria Lindsey",
      "title": "Human Resources Benefits Manager",
      "company": "Thiele Kaolin Company"
    },
    {
      "quote": "This is the best seminar I have ever attended. Our instructor was thoroughly engaging and his energy, enthusiasm and enjoyment of his subjects was infectious.",
      "name": "John H. Livingston",
      "title": "Assistant General Counsel & Human Resources Director",
      "company": "Liberty National Life Insurance Company"
    },
    {
      "quote": "The seminar, in my opinion, was second to none. All of the information was very well delivered and explained in detail so that everyone, from the least to the most experienced, was able to understand. IAML did an outstanding job and I will be sure to highly recommend your seminars to anyone who inquires.",
      "name": "Laurie Keenan",
      "title": "Director of Human Resources",
      "company": "Mohegan Sun"
    },
    {
      "quote": "I was extremely happy with the presenters. The information exceeded my expectations and the other participants were very helpful in sharing their experiences. I signed up for this course after researching 'human resources training' on the internet. I reviewed a lot of different training programs and determined the information on your website was the most thorough and comprehensive.",
      "name": "Teresa Malekzadeh",
      "title": "Executive Director",
      "company": "Beacon School"
    },
    {
      "quote": "Excellent seminar! This is the second IAML class I have attended. As a new manager, the information presented was invaluable! The instructor was amazing! I will definitely be back!",
      "name": "Holly Dean",
      "title": "Employment Manager",
      "company": "Alfa Insurance Company"
    },
    {
      "quote": "Both speakers were excellent. Their real life experiences and examples provided thorough explanations of the content, and the interaction in/within class was very helpful. Very informative!",
      "name": "Kristin Stinson",
      "title": "HR Training and Compliance Officer",
      "company": "SOC Nevada, LLC"
    },
    {
      "quote": "I would highly recommend the Certificate in Employee Relations Law seminar to anyone who wants a solid understanding of employment law. The instructors were extremely knowledgeable and made the material easy to understand, even for those without a legal background.",
      "name": "Michael Dalton",
      "title": "Senior HR Manager",
      "company": "ITW"
    },
    {
      "quote": "Fantastic blend of 'need to know' information and practical examples. This program gave me a deeper understanding of employment law and HR best practices that I can immediately apply back at work.",
      "name": "Jami Painter",
      "title": "Ed.M., Senior Associate Vice President and Chief Human Resources Officer",
      "company": "University of Illinois System"
    },
    {
      "quote": "Information and materials were excellent, but what sets this seminar apart was the quality of the instructor! Ray's knowledge of employment law and practical experience was superb. He explained difficult legal concepts in a way that was easy to understand and apply.",
      "name": "Yvette Klepper",
      "title": "Fire Officer",
      "company": "Palm Beach County Tax Collector's Office"
    },
    {
      "quote": "Another outstanding conference. IAML and John Wymer always do a terrific job of providing timely, relevant information in an engaging manner.",
      "name": "Vicki Vanderpool",
      "title": "Vice President, Human Resources",
      "company": "Ingram Industries, Inc."
    },
    {
      "quote": "Excellent experience! The seminar was very enlightening and informative. IAML always brings top-notch presenters with relevant experience. I will continue to attend IAML seminars and recommend them to others.",
      "name": "Stacy Ramsey",
      "title": "Human Resources Manager",
      "company": "PGT Custom Windows and Doors"
    },
    {
      "quote": "This is one of the best seminars I have ever attended. Our instructor was very knowledgeable and his enthusiasm for his subjects was infectious. I was sorry for it to end on Friday.",
      "name": "John H. Livingston",
      "title": "Agency Vice President",
      "company": "Liberty National Life Insurance Company"
    },
    {
      "quote": "Brenda Heinicke was outstanding! Energetic, informative and she kept the attention of the class. I walked away with more tools to do my job. Great conference!",
      "name": "Jace Hunter",
      "title": "Manager, HR Business Partner",
      "company": "Hornbeck Offshore Services"
    },
    {
      "quote": "Outstanding conference. One of the best I've been to. Great variety of presenters and topics. Very informative.",
      "name": "Nicole Zemanek",
      "title": "Director of Human Resources",
      "company": "Mark-Taylor, Inc."
    },
    {
      "quote": "The training both was excellent both in content and delivery. I learned a great deal and the materials will be a wonderful resource. This was one of the best programs I have ever attended.",
      "name": "Stephen Santay",
      "title": "Training Director",
      "company": "KTLA"
    },
    {
      "quote": "The Advanced HR Management Program was extremely informative and very valuable. The faculty did an excellent job explaining complex concepts in ways that were easy to understand. The material was very useful and applicable to my job.",
      "name": "Diane Butler",
      "title": "HR Business Partner",
      "company": "Federated Mutual Insurance Co."
    },
    {
      "quote": "Overall, this was one of the best conferences I have attended in my career. The content was relevant and timely and the presenters were engaging and knowledgeable.",
      "name": "Bill Davidson",
      "title": "Manager, Human Resources",
      "company": "Big Lots, Inc."
    },
    {
      "quote": "The information presented in this course was excellent! The speakers were very knowledgeable and did an excellent job of making the information understandable and practical.",
      "name": "Jody Ryan",
      "title": "Human Resources Specialist",
      "company": "Inpro Corporation"
    },
    {
      "quote": "The examples used and interactive nature of the program brought the materials to life. This is one of the best programs I have attended in my HR career.",
      "name": "Paul Carney",
      "title": "EVP, Chief Human Resources Officer",
      "company": "Carter Bank & Trust"
    },
    {
      "quote": "The course was very informative and provided an excellent overview of employment law and HR best practices. I gained a wealth of knowledge that I will use in my role every day.",
      "name": "Bruce Harden",
      "title": "Manager, Labor Relations",
      "company": "Philadelphia Gas Works"
    },
    {
      "quote": "This was the best HR seminar that I have ever attended. It provided a thorough overview of critical HR information and was very well organized. The attorneys were humorous and understood the HR challenges that we face, they gave good advice.",
      "name": "Tracy Gee",
      "title": "Chief People Officer",
      "company": "National Association of Corporate Directors"
    },
    {
      "quote": "The seminar was excellent. The instructors were extremely knowledgeable and did a great job of explaining complex HR and employment law concepts in an understandable way. Not only did this seminar provide answers to questions I had, but it also gave me a new appreciation for what I do.",
      "name": "Angelique Anderson",
      "title": "Executive Director, Strategic HR Business Partnerships - People & Culture",
      "company": "Catalina Marketing"
    },
    {
      "quote": "The program was very informative, the conversation and informal discussions were helpful, and the instructors were excellent. They made every effort to address questions and topics that we raised.",
      "name": "Charlotte Witt",
      "title": "Senior Employee Relations Specialist",
      "company": "Christiana Care Health System"
    },
    {
      "quote": "Brenda Heinicke was fantastic! She did an amazing job of presenting information clearly, engaging the group, and encouraging participation. She offered practical tools to help us in employee relations and employee discipline situations instead of 'talking at us' like many instructors tend to do.",
      "name": "Brittany Hepler",
      "title": "Mobility Supervisor",
      "company": "Dayle McIntosh Disability Resource"
    },
    {
      "quote": "The information covered in this program was excellent! The speakers were very knowledgeable and engaging and allowed enough time to go over all the changes in this ever-changing field.",
      "name": "Monica Taylor",
      "title": "Human Resources Manager",
      "company": "Oak Hall Cap & Gown"
    },
    {
      "quote": "The Advanced Certificate in Employment Law presented by Ray and Laura was excellent. The presenters were extremely knowledgeable, engaging and provided practical real-world examples to help us understand the law. If you can choose only one employment law conference, this is the one!",
      "name": "Laura Massa",
      "title": "SVP, Human Resources",
      "company": "Sun Communities & Sun RV Resorts"
    },
    {
      "quote": "I think that this program is one of the best that you could ever attend. The instructors were very knowledgeable and gave many examples that made understanding easier. I left this training with the human resource equipment I need.",
      "name": "Dennis Scott",
      "title": "Personnel Officer",
      "company": "Office of Regulation Policy and Management, Department of Veterans Affairs"
    },
    {
      "quote": "With almost 20 years in the field of employment law, this was one of the best, if not the best, seminar I have ever attended.",
      "name": "Charles Rando",
      "title": "Personnel Field Manager",
      "company": "Wyoming Department of Workforce Services"
    },
    {
      "quote": "This was an excellent seminar and covered everything I'd hoped. The instructors were outstanding.",
      "name": "Kurt Henkel",
      "title": "Senior Benefits Plan Analyst",
      "company": "Deere & Company"
    },
    {
      "quote": "The seminar was the best. Faculty did an outstanding job of making complex topics understandable and relevant to HR professionals. I am planning to attend the Advanced Conference.",
      "name": "James Dillard",
      "title": "Personnel Administrator",
      "company": "Lubrizol"
    },
    {
      "quote": "The Advanced Certificate in Employment Law was outstanding. The presenters did a great job of presenting the information in a way that was easy to understand and offered practical guidance for implementation.",
      "name": "Julie O'Dell-Michie",
      "title": "Human Resources Director",
      "company": "JM Family Enterprises, Inc."
    },
    {
      "quote": "This class was great. Brenda was very knowledgeable and provided a lot of practical suggestions and tools that I'll use every day. I would highly recommend this course to others.",
      "name": "Debbie Chavez",
      "title": "Center Business Administrator",
      "company": "Sandia National Laboratories"
    },
    {
      "quote": "Brenda Heinicke was fantastic. She used a very common sense approach to communicate best HR practices.",
      "name": "Jon Flowers",
      "title": "Employee Relations Supervisor",
      "company": "Fred Hutchinson Cancer Research Center"
    },
    {
      "quote": "I thoroughly enjoyed the program. I appreciate the role playing and the real-life scenarios and her explanations of why one approach may work better than another.",
      "name": "Tammy Gabard",
      "title": "Senior Manager – Employee Relations",
      "company": "RAI Services Company"
    },
    {
      "quote": "I am a regular and will continue to attend and work with IAML. My overall experience has been very positive; the curriculum is up-to-date, pertinent and presented in an excellent manner.",
      "name": "Timothy Taylor",
      "title": "Human Resources Director",
      "company": "The Home Depot"
    }
  ];
  
  function initializeTestimonialsCarousel() {
    const list = document.getElementById('testimonials-list');
    if (!list) return;
    
    // Star rating image URL
    const starImageUrl = 'https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/68d667936fe1a53fe6603670.png';
    
    // Populate slides
    if (Array.isArray(testimonialsData) && testimonialsData.length) {
      list.innerHTML = '';
      testimonialsData.forEach(({ quote, name, title, company }) => {
        const li = document.createElement('li');
        li.className = 'splide__slide';
        
        // Clean quote text
        const clean = String(quote || '')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/(^"|"$)/g, '');
        
        li.innerHTML = `
          <div class="testimonial-card relative rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,.03)]">
            <div class="star-rating">
              <img src="${starImageUrl}" alt="5 star rating" class="h-5 w-auto opacity-90 star-image">
            </div>
            <blockquote class="text-gray-200 text-lg leading-relaxed relative z-10 italic font-normal">
              "${clean}"
            </blockquote>
            <div class="pt-4 mt-auto">
              <div class="author-name">${name || ''}</div>
              <div class="author-title">${title || ''}</div>
              <div class="author-company">${company || ''}</div>
            </div>
          </div>`;
        list.appendChild(li);
      });
    }
    
    // Check if Splide is loaded - retry if not available
    if (typeof Splide === 'undefined') {
      console.warn('Splide library not loaded, retrying...');
      // Retry after 100ms if Splide isn't available yet
      setTimeout(initializeTestimonialsCarousel, 100);
      return;
    }
    
    // Initialize Splide carousel
    const splide = new Splide('#testimonials-splide', {
      type: 'loop',
      perPage: 4,
      perMove: 1,
      gap: '1.5rem',
      autoplay: false,
      interval: 5000,
      pauseOnHover: true,
      arrows: true,
      pagination: false,
      drag: true,
      focus: false,
      trimSpace: false,
      padding: 0,
      breakpoints: {
        1400: { perPage: 3, gap: '1.25rem', padding: 0 },
        1024: { perPage: 2, gap: '1rem', padding: 0 },
        768: { perPage: 1, gap: '1rem', padding: 0 },
        576: { perPage: 1, gap: '0.75rem', padding: 0 }
      }
    });
    
    try {
      splide.mount();
    } catch (error) {
      console.error('Error mounting Splide carousel:', error);
      return;
    }

    // Ensure spotlight applies on initial load after DOM is fully rendered
    setTimeout(() => {
      updateSpotlight();
    }, 100);

    // ========================================================================
    // SPOTLIGHT EFFECT MANAGEMENT
    // ========================================================================

    function getSpotlightPosition() {
      const width = window.innerWidth;
      return width <= 768 ? -1 : 1; // -1 = mobile (no spotlight), 1 = second from left
    }

    function updateSpotlight() {
      const spotlightPos = getSpotlightPosition();

      // Remove spotlight from all slides
      const allSlides = document.querySelectorAll('#testimonials-splide .splide__slide');
      allSlides.forEach(slide => {
        slide.classList.remove('spotlight-active');
      });

      // Mobile mode: CSS handles no-blur
      if (spotlightPos === -1) return;

      // Get all visible slides in the viewport
      const visibleSlides = document.querySelectorAll('#testimonials-splide .splide__slide.is-visible');

      // Apply spotlight to the slide at the spotlight position (0-indexed, so position 1 = second from left)
      if (visibleSlides && visibleSlides[spotlightPos]) {
        visibleSlides[spotlightPos].classList.add('spotlight-active');
      }
    }

    // Event listeners
    splide.on('moved', updateSpotlight);
    splide.on('mounted', updateSpotlight);
    splide.on('visible', updateSpotlight);

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateSpotlight, 150);
    });

    // Click any slide to move it to the spotlight position
    const testimonialsList = document.getElementById('testimonials-list');
    if (testimonialsList) {
      testimonialsList.addEventListener('click', (e) => {
        const slide = e.target.closest('.splide__slide');
        if (!slide) return;

        const spotlightPos = getSpotlightPosition();

        // On mobile (spotlightPos === -1), just navigate to the card
        if (spotlightPos === -1) {
          const clickedIndex = parseInt(slide.getAttribute('data-splide-index') || '0', 10);
          splide.go(clickedIndex);
          return;
        }

        // Get all visible slides
        const visibleSlides = document.querySelectorAll('#testimonials-splide .splide__slide.is-visible');

        // Find the position of the clicked slide among visible slides
        let clickedPosition = -1;
        visibleSlides.forEach((visibleSlide, index) => {
          if (visibleSlide === slide) {
            clickedPosition = index;
          }
        });

        if (clickedPosition === -1) return; // Safety check

        // Calculate how many positions to move
        const moveBy = clickedPosition - spotlightPos;

        // Move the carousel relatively
        if (moveBy !== 0) {
          splide.go(moveBy > 0 ? `+${moveBy}` : `${moveBy}`);
        }
      });
    }
    
    // Trackpad/mouse wheel horizontal navigation
    (function addWheelNav() {
      const root = splide.root;
      let last = 0;
      const throttleMs = 220;
      const threshold = 10;
      
      root.addEventListener('wheel', (e) => {
        const axisX = Math.abs(e.deltaX);
        const axisY = Math.abs(e.deltaY);
        
        // Only intercept if horizontal scroll is dominant
        if (axisX <= axisY) return;
        
        const delta = e.deltaX;
        if (Math.abs(delta) < threshold) return;
        
        const now = Date.now();
        if (now - last < throttleMs) {
          e.preventDefault();
          return;
        }
        
        if (delta > 0) splide.go('>');
        else splide.go('<');
        
        last = now;
        e.preventDefault();
      }, { passive: false });
    })();
  }
  
  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', initializeTestimonialsCarousel);