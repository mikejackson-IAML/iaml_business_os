// Quiz System - Program Recommendation Engine
// Handles the interactive quiz for program matching

// Engine Class (from your quiz section)
class ProgramRecommendationEngine {
    constructor() {
      this.inPersonPrograms = [
        'certificate in employee relations law',
        'advanced certificate in strategic employment law',
        'certificate in conducting workplace investigations',
        'certificate in strategic hr management',
        'certificate in employee benefits law',
        'advanced certificate in employee benefits law'
      ];
      
      this.virtualPrograms = [
        'certificate in labor law mastery',
        'certificate in discrimination prevention & defense',
        'certificate in conducting workplace investigations',
        'certificate in hr law fundamentals',
        'certificate in strategic hr leadership',
        'certificate in retirement plans',
        'certificate in benefit plan claims, appeals & litigation',
        'certificate in welfare benefits plan issues',
        'advanced certificate in strategic employment law'
      ];
      
      this.challengeKeywords = {
        compliance: ['employment law', 'compliance', 'legal', 'regulations', 'policy', 'risk', 'litigation', 'discrimination'],
        benefits: ['benefits', 'erisa', 'retirement', 'healthcare', 'welfare', 'pension', 'claims', 'appeals'],
        management: ['strategic', 'leadership', 'management', 'planning', 'development', 'culture', 'performance'],
        investigations: ['investigations', 'workplace investigations', 'complaints', 'harassment', 'misconduct', 'interviews']
      };
      
      this.roleKeywords = {
        executive: ['executive', 'senior', 'strategic', 'leadership', 'c-suite', 'advanced'],
        director: ['director', 'senior', 'strategic', 'leadership', 'advanced'],
        manager: ['manager', 'management', 'supervisor', 'team lead'],
        specialist: ['specialist', 'professional', 'practitioner', 'coordinator']
      };
      
      this.experienceKeywords = {
        entry: ['foundation', 'basics', 'fundamentals', 'introduction', 'beginner'],
        developing: ['intermediate', 'developing', 'building'],
        experienced: ['advanced', 'experienced', 'expert', 'mastery'],
        senior: ['advanced', 'strategic', 'expert', 'mastery', 'senior']
      };
      
      this.programDescriptions = {
        'Certificate in Employee Relations Law Seminar': 'Master essential employment law fundamentals and compliance strategies.',
        'Certificate in Strategic HR Management': 'Transform your HR leadership skills and drive organizational success.',
        'Advanced Certificate in Strategic Employment Law': 'Navigate complex employment law challenges with expert-level insights.',
        'Certificate in Conducting Workplace Investigations': 'Become your organization\'s trusted expert in workplace investigations.',
        'Certificate in Employee Benefits Law': 'Master ERISA compliance and benefits administration complexities.',
        'Advanced Certificate in Employee Benefits Law': 'Tackle advanced benefits law challenges and regulatory requirements.',
        'Certificate in Labor Law Mastery': 'Build expertise in labor relations and union management strategies.',
        'Certificate in Discrimination Prevention & Defense': 'Prevent workplace discrimination and defend your organization effectively.',
        'Certificate in HR Law Fundamentals': 'Build foundational knowledge in employment law and HR compliance essentials.',
        'Certificate in Strategic HR Leadership': 'Lead strategic HR initiatives that drive workforce performance and business success.',
        'Certificate in Retirement Plans': 'Navigate retirement plan administration and fiduciary responsibilities with confidence.',
        'Certificate in Benefit Plan Claims, Appeals & Litigation': 'Master the complexities of benefits claims management and dispute resolution.',
        'Certificate in Welfare Benefits Plan Issues': 'Ensure compliance and optimize welfare benefits plan administration.'
      };
      
      this.programOutcomes = {
        'Certificate in Employee Relations Law Seminar': [
          'Navigate complex employment law requirements with confidence',
          'Implement compliant hiring and termination practices',
          'Develop effective workplace policies and procedures',
          'Handle FMLA, ADA, and leave management issues',
          'Prevent and address discrimination and harassment claims'
        ],
        // Add other program outcomes as needed...
      };
    }
    
    filterProgramsByFormat(programs, format) {
      let filtered = programs;
      if (format === 'in-person') {
        filtered = programs.filter(p => {
          const n = (p.name || '').toLowerCase();
          return this.inPersonPrograms.some(t => n.includes(t));
        });
        if (!filtered.length) filtered = programs;
      }
      if (format === 'virtual') {
        filtered = programs.filter(p => {
          const n = (p.name || '').toLowerCase();
          return this.virtualPrograms.some(t => n.includes(t));
        });
        if (!filtered.length) filtered = programs;
      }
      return filtered;
    }
    
    findBestProgramMatch(programs, userAnswers) {
      const role = userAnswers.role || 'manager';
      const challenge = userAnswers.challenge || 'compliance';
      const experience = userAnswers.experience || 'developing';
      const format = userAnswers.format || 'virtual';
      
      let filtered = this.filterProgramsByFormat(programs, format);
      const priority = this.findPriorityMatch(filtered, role, challenge);
      if (priority) return priority;
      
      return this.scoreAndRankPrograms(filtered, {role, challenge, experience, format});
    }
    
    findPriorityMatch(list, role, challenge) {
      if (challenge === 'compliance') {
        if (role === 'executive') {
          const adv = list.find(p => p.name.toLowerCase().includes('advanced') && 
            (p.name.toLowerCase().includes('employment law') || p.name.toLowerCase().includes('strategic employment')));
          if (adv) return adv;
        } else {
          const rel = list.find(p => p.name.toLowerCase().includes('employee relations law') || 
            p.name.toLowerCase().includes('certificate in employee relations'));
          if (rel) return rel;
        }
      }
      if (challenge === 'benefits') {
        if (role === 'executive') {
          const advB = list.find(p => p.name.toLowerCase().includes('advanced') && p.name.toLowerCase().includes('benefits'));
          if (advB) return advB;
        } else {
          const cert = list.find(p => p.name.toLowerCase().includes('certificate in employee benefits') || 
            (p.name.toLowerCase().includes('employee benefits') && !p.name.toLowerCase().includes('advanced')));
          if (cert) return cert;
        }
      }
      return null;
    }
    
    scoreAndRankPrograms(list, userAnswers) {
      const {role, challenge, experience} = userAnswers;
      const scored = list.map(program => {
        let score = 0;
        const desc = (program.description || '').toLowerCase();
        const audience = (program.targetAudience || '').toLowerCase();
        const name = (program.name || '').toLowerCase();
        
        (this.challengeKeywords[challenge] || []).forEach(k => {
          if (desc.includes(k) || name.includes(k)) score += 3;
        });
        (this.roleKeywords[role] || []).forEach(k => {
          if (audience.includes(k) || desc.includes(k)) score += 2;
        });
        (this.experienceKeywords[experience] || []).forEach(k => {
          if (desc.includes(k) || audience.includes(k) || name.includes(k)) score += 1;
        });
        
        if (challenge === 'investigations') {
          if (name.includes('investigations')) score += 20;
          else score = 0;
        }
        if (challenge === 'benefits' && name.includes('benefits')) score += 5;
        if (challenge === 'compliance' && (name.includes('employment law') || name.includes('legal'))) score += 5;
        if (challenge === 'management' && (name.includes('strategic') || name.includes('hr management') || name.includes('leadership'))) score += 5;
        
        return {program, score};
      });
      scored.sort((a, b) => b.score - a.score);
      return scored[0]?.program || null;
    }
    
    formatRecommendation(program, userFormat) {
      if (!program) {
        return {
          id: undefined,
          program: 'Certificate in Employee Relations Law Seminar',
          format: 'Multiple formats available',
          description: 'Master essential employment law fundamentals and compliance strategies.',
          learningOutcomes: []
        };
      }
      
      let displayFormat = program.format || 'Multiple formats available';
      if (userFormat === 'team') displayFormat = 'Available for corporate on-site training';
      else if (userFormat === 'virtual') displayFormat = 'Available in live virtual format';
      else if (userFormat === 'in-person') displayFormat = 'Available in-person with networking opportunities';
      else if (userFormat === 'self-paced') displayFormat = 'Self-paced learning options available';
      
      return {
        id: program.id,
        program: program.name,
        format: displayFormat,
        description: this.programDescriptions[program.name] || 'Professional development program designed to advance your HR expertise.',
        learningOutcomes: program.learningOutcomes || []
      };
    }
    
    getProgramOutcomes(programName) {
      return this.programOutcomes[programName] || [
        'Enhanced professional knowledge and skills',
        'Practical tools and strategies for immediate application',
        'Industry best practices and compliance guidance',
        'Confidence to handle complex workplace challenges',
        'Professional development and career advancement'
      ];
    }
  }
  
  // Export for use
  if (typeof window !== 'undefined') {
    window.ProgramRecommendationEngine = ProgramRecommendationEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgramRecommendationEngine;
  }
  
  // Quiz UI Logic
  let programCatalog = [];
  let answers = {};
  let currentRecommendation = null;
  let currentQuestion = 0;
  let userAnswers = {};
  let startTime = new Date();
  let isTransitioning = false;
  
  // Static program fallback
  const staticPrograms = [
    { id: 'p1', name: 'Certificate in Employee Relations Law Seminar', description: 'Employment law, compliance, regulations, policy, risk.', targetAudience: 'HR professional, manager, director', format: 'In-person & Virtual' },
    { id: 'p2', name: 'Advanced Certificate in Strategic Employment Law', description: 'Executive, strategic, advanced employment law.', targetAudience: 'Executive, C-suite, senior HR', format: 'In-person & Virtual' },
    { id: 'p3', name: 'Certificate in Conducting Workplace Investigations', description: 'Investigations, harassment, misconduct, interviews.', targetAudience: 'HR professional, manager', format: 'In-person & Virtual' },
    { id: 'p4', name: 'Certificate in Strategic HR Management', description: 'Strategic HR, leadership, culture, performance.', targetAudience: 'Manager, director, senior HR', format: 'In-person' },
    { id: 'p5', name: 'Certificate in Employee Benefits Law', description: 'Benefits, ERISA, retirement plans, welfare.', targetAudience: 'Benefits manager, HR professional', format: 'In-person & Virtual' }
  ];
  
  // Show/hide circle animation
  function hideCircleAnimation() {
    const circle = document.getElementById('circleContainer');
    if (circle) {
      circle.classList.add('hidden');
    }
  }

  function showCircleAnimation() {
    const circle = document.getElementById('circleContainer');
    if (circle) {
      circle.classList.remove('hidden');
    }
  }

  function startQuiz() {
    hideCircleAnimation();
    const quizPreview = document.getElementById('quizContainer');
    if (quizPreview) {
      quizPreview.style.display = 'flex';
    }
    initQuiz();
  }

  // Quiz data model
  let quizData = {
    questions: [
      { 
        id: 'role', 
        title: 'What best describes your current role?', 
        options: [
          { value: 'specialist', title: 'HR Professional', description: 'HR Specialist, Coordinator, or Analyst' },
          { value: 'manager', title: 'HR Manager', description: 'HR Manager, Benefits Manager, or team lead' },
          { value: 'director', title: 'Director/VP Level', description: 'Director of HR, VP of People, or similar' },
          { value: 'executive', title: 'C-Suite/Executive', description: 'CEO, CHRO, COO, or other executive leadership' }
        ]
      },
      { 
        id: 'challenge', 
        title: 'What\'s your biggest workplace challenge right now?', 
        options: [
          { value: 'compliance', title: 'Legal Compliance', description: 'Staying current with employment laws and regulations' },
          { value: 'leadership', title: 'Leadership Development', description: 'Building stronger management and leadership skills' },
          { value: 'culture', title: 'Workplace Culture', description: 'Creating positive, inclusive work environments' },
          { value: 'performance', title: 'Performance Management', description: 'Improving employee performance and accountability' }
        ]
      },
      { 
        id: 'experience', 
        title: 'How would you describe your experience level?', 
        options: [
          { value: 'new', title: 'New to HR/Management', description: 'Less than 2 years in current role' },
          { value: 'developing', title: 'Developing Skills', description: '2–5 years, looking to build expertise' },
          { value: 'experienced', title: 'Experienced Professional', description: '5+ years, seeking advanced knowledge' },
          { value: 'expert', title: 'Senior Expert', description: '10+ years, want cutting-edge insights' }
        ]
      },
      { 
        id: 'format', 
        title: 'What learning format works best for you?', 
        options: [
          { value: 'in-person', title: 'In-Person Events', description: 'Face-to-face networking and learning' },
          { value: 'virtual', title: 'Virtual Learning', description: 'Online sessions I can attend from anywhere' },
          { value: 'self-paced', title: 'Self-Paced Study', description: 'Materials I can review on my schedule' }
        ]
      }
    ]
  };
  
  // Initialize quiz
  function initQuiz() {
    currentQuestion = 0;
    displayQuestion();
  }
  
  function displayQuestion() {
    if (currentQuestion >= quizData.questions.length) {
      showThinkingAnimation();
      return;
    }
    
    const q = quizData.questions[currentQuestion];
    const pct = ((currentQuestion + 1) / quizData.questions.length) * 100;
    
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const questionText = document.getElementById('questionText');
    
    if (progressText) progressText.textContent = `Question ${currentQuestion + 1} of ${quizData.questions.length}`;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (questionText) questionText.textContent = q.title;
    
    const optionsContainer = document.getElementById('optionsContainer');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `<span class="option-title">${opt.title}</span><span class="option-desc">${opt.description || ''}</span>`;
      btn.onclick = () => selectOption(btn, q.id, opt.value, opt.title, q.title, currentQuestion + 1);
      optionsContainer.appendChild(btn);
    });
    
    const backButton = document.getElementById('backButton');
    if (backButton) {
      backButton.style.display = currentQuestion > 0 ? 'block' : 'none';
    }
  }
  
  function selectOption(el, qid, val, label, questionText, number) {
    if (isTransitioning) return;
    isTransitioning = true;
    
    el.classList.add('selected');
    document.querySelectorAll('.option-btn').forEach(o => {
      o.classList.add('disabled');
      o.style.pointerEvents = 'none';
    });
    
    userAnswers[qid] = val;
    answers[qid] = val;
    
    setTimeout(() => {
      nextQuestion();
    }, 600);
  }
  
  function nextQuestion() {
    isTransitioning = false;
    document.querySelectorAll('.option-btn').forEach(o => {
      o.classList.remove('disabled', 'selected');
      o.style.pointerEvents = 'auto';
    });
    currentQuestion++;
    displayQuestion();
  }
  
  function goBack() {
    if (currentQuestion > 0) {
      currentQuestion--;
      const qId = quizData.questions[currentQuestion].id;
      delete userAnswers[qId];
      delete answers[qId];
      displayQuestion();
    }
  }
  
  function showThinkingAnimation() {
    const container = document.getElementById('quizContainer');
    if (!container) return;
    
    container.innerHTML = `
      <div class="thinking-container">
        <div class="thinking-text">Analyzing your answers...</div>
        <div class="thinking-messages" id="thinkingMessages">Finding your perfect program match</div>
        <div class="thinking-spinner"></div>
      </div>`;
    
    const msgs = [
      'Finding your perfect program match',
      'Analyzing your role and challenges',
      'Matching experience levels',
      'Personalizing recommendations'
    ];
    
    let i = 0;
    const iv = setInterval(() => {
      const el = document.getElementById('thinkingMessages');
      if (el) {
        i = (i + 1) % msgs.length;
        el.textContent = msgs[i];
      }
    }, 1000);
    
    setTimeout(() => {
      clearInterval(iv);
      showRecommendationModal();
    }, 4000);
  }
  
  async function getRecommendation() {
    if (!programCatalog || !programCatalog.length) {
      programCatalog = staticPrograms;
    }
    
    const engine = new ProgramRecommendationEngine();
    const normalized = normalizeAnswersForEngine(userAnswers);
    const best = engine.findBestProgramMatch(programCatalog, normalized);
    const formatted = engine.formatRecommendation(best, normalized.format);
    const outcomes = engine.getProgramOutcomes(formatted.program);
    
    return {
      id: formatted.id || best?.id,
      title: formatted.program,
      description: formatted.description,
      topics: [],
      learningOutcomes: Array.isArray(outcomes) ? outcomes : [],
      registerUrl: best?.registerUrl || '#',
      learnMoreUrl: best?.learnMoreUrl || '#',
      formatText: formatted.format
    };
  }
  
  function normalizeAnswersForEngine(src) {
    const mapChallenge = {
      compliance: 'compliance',
      leadership: 'management',
      culture: 'management',
      performance: 'management'
    };
    
    const mapExperience = {
      new: 'entry',
      developing: 'developing',
      experienced: 'experienced',
      expert: 'senior'
    };
    
    return {
      role: src.role,
      challenge: mapChallenge[src.challenge] || 'management',
      experience: mapExperience[src.experience] || 'developing',
      format: src.format
    };
  }
  
  async function showRecommendationModal() {
    try {
      const rec = await getRecommendation();
      currentRecommendation = rec;
      
      const modal = document.getElementById('recommendationModal');
      if (!modal) return;
      
      const title = document.getElementById('modalProgramTitle');
      const description = document.getElementById('modalProgramDescription');
      const benefitsTitle = document.getElementById('modalBenefitsTitle');
      const benefitsList = document.getElementById('modalBenefitsList');
      const topicsList = document.getElementById('modalTopicsList');
      
      if (title) title.textContent = rec.title || 'Professional Development Program';
      if (description) {
        description.textContent = (rec.description || 'A comprehensive program designed for your professional growth.') +
          (rec.formatText ? ` — ${rec.formatText}` : '');
      }
      
      if (benefitsTitle) {
        benefitsTitle.textContent = `By the end of this program, ${answers.format === 'team' ? 'your team' : 'you'} will be able to:`;
      }
      
      if (benefitsList) {
        benefitsList.innerHTML = (rec.learningOutcomes && rec.learningOutcomes.length
          ? rec.learningOutcomes
          : ['Comprehensive professional development', 'Industry best practices', 'Practical application techniques']
        ).map(x => `<li>${x}</li>`).join('');
      }
      
      if (topicsList) {
        topicsList.innerHTML = (rec.topics && rec.topics.length
          ? rec.topics
          : ['Industry best practices and current trends', 'Regulatory compliance and legal updates', 'Professional development strategies']
        ).map(x => `<li>${x}</li>`).join('');
      }
      
      modal.style.display = 'block';
    } catch (e) {
      console.error(e);
      showFallbackRecommendation();
    }
  }
  
  function showFallbackRecommendation() {
    const modal = document.getElementById('recommendationModal');
    if (!modal) return;
    
    const title = document.getElementById('modalProgramTitle');
    const description = document.getElementById('modalProgramDescription');
    
    if (title) title.textContent = 'Professional Development Program';
    if (description) {
      description.textContent = 'Based on your responses, we have several programs that would be perfect for your professional development needs.';
    }
    
    modal.style.display = 'block';
  }
  
  function closeModal() {
    const modal = document.getElementById('recommendationModal');
    if (modal) modal.style.display = 'none';
    setTimeout(() => {
      resetQuiz();
    }, 400);
  }
  
  function resetQuiz() {
    currentQuestion = 0;
    userAnswers = {};
    answers = {};
    currentRecommendation = null;
    startTime = new Date();
    isTransitioning = false;
    
    const container = document.getElementById('quizContainer');
    if (!container) return;
    
    container.innerHTML = `
      <div class="quiz-progress">
        <span class="progress-text" id="progressText">Question 1 of 4</span>
        <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:25%"></div></div>
      </div>
      <div class="quiz-question" id="questionContainer">
        <p id="questionText">What best describes your current role?</p>
      </div>
      <div class="quiz-options" id="optionsContainer"></div>
      <button class="back-button" id="backButton" onclick="goBack()">← BACK</button>`;
    
    initQuiz();
  }
  
  // Initialize when DOM is ready
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
      // Show animation initially
      showCircleAnimation();

      // Hide quiz preview initially
      const quizPreview = document.getElementById('quizContainer');
      if (quizPreview) {
        quizPreview.style.display = 'none';
      }

      // Add click handler to start quiz
      const circleContainer = document.getElementById('circleContainer');
      if (circleContainer) {
        circleContainer.style.cursor = 'pointer';
        circleContainer.addEventListener('click', startQuiz);
      }
    });
  }

  // Make functions globally available
  if (typeof window !== 'undefined') {
    window.startQuiz = startQuiz;
    window.hideCircleAnimation = hideCircleAnimation;
    window.showCircleAnimation = showCircleAnimation;
    window.goBack = goBack;
    window.closeModal = closeModal;
    window.resetQuiz = resetQuiz;
  }