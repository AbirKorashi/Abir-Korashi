import emailjs from '@emailjs/browser';

const EMAILJS_CONFIG = {
  publicKey: 'XczStpx2UtpJ5hnSC',
  serviceId: 'service_u72yjrl',
  templateId: 'template_ftc9ega',
};

// Project details for the interactive modal
const PROJECT_DETAILS = {
  nutrilink: {
    category: 'Database & Web Application',
    title: 'NutriLink — Food Donation Management System',
    overview:
      'A database-driven platform designed to connect food donors and receivers while managing food batches, claims, and donation records.',
    problem:
      'Replaces fragmented coordination with structured batch tracking, claim status verification, and auditable relational donation records.',
    features: [
      'Structured donor and receiver workflows for listing and claiming food batches',
      'Relational MySQL database tracking batch details, claims, and historical records',
      'Interactive Streamlit interface for managing active donations efficiently',
    ],
    tech: 'Python · Streamlit · MySQL',
    githubUrl: 'https://github.com/AbirKorashi',
  },
  'career-copilot': {
    category: 'AI & Data Application',
    title: 'Career Copilot — Interactive Learning and Practice Platform',
    overview:
      'A learning application designed to provide structured practice, track progress, and explore model-assisted feedback.',
    problem:
      'Organizes scattered study workflows into repeatable practice sessions backed by persistent local storage and Scikit-learn feedback.',
    features: [
      'Structured practice modules with persistent SQLite progress tracking',
      'Model-assisted feedback workflows built with Scikit-learn and Python',
      'Accessible web application interface powered by Streamlit',
    ],
    tech: 'Python · Scikit-learn · SQLite · Streamlit',
    githubUrl: 'https://github.com/AbirKorashi',
  },
  'canteen-vendor': {
    category: 'Product Design & Workflow',
    title: 'Canteen Vendor Management System',
    overview:
      'A university-focused platform for vendor applications, vendor evaluation, appointment management, and student feedback.',
    problem:
      'Brings transparency and repeatable workflows to campus canteen vendor onboarding, appointment scheduling, and student review cycles.',
    features: [
      'End-to-end interface prototypes designed in Figma for vendor applications and evaluations',
      'Appointment management and structured student feedback user flows',
      'Sprint backlog organization and task tracking managed in Jira',
    ],
    tech: 'Figma · Jira',
    githubUrl: '',
  },
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic footer year
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // 2. Sticky header scroll shadow
  const header = document.getElementById('site-header');
  const updateHeaderScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 16);
  };
  window.addEventListener('scroll', updateHeaderScroll, { passive: true });
  updateHeaderScroll();

  // 3. Mobile navigation drawer
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-navigation');
  const menuIcon = mobileToggle?.querySelector('.icon-menu');
  const closeIcon = mobileToggle?.querySelector('.icon-close');

  const setMobileMenuOpen = (isOpen) => {
    if (!mobileToggle || !mobileNav) return;
    mobileNav.classList.toggle('hidden', !isOpen);
    mobileToggle.setAttribute('aria-expanded', String(isOpen));
    mobileToggle.setAttribute(
      'aria-label',
      isOpen ? 'Close navigation menu' : 'Open navigation menu'
    );
    menuIcon?.classList.toggle('hidden', isOpen);
    closeIcon?.classList.toggle('hidden', !isOpen);
  };

  mobileToggle?.addEventListener('click', () => {
    const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
    setMobileMenuOpen(!isExpanded);
  });

  mobileNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMobileMenuOpen(false));
  });

  // 4. Active navigation link scrollspy
  const navLinks = document.querySelectorAll('[data-section]');
  const sectionIds = ['hero', 'projects', 'about', 'skills', 'education', 'contact'];

  const setActiveNav = (activeId) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('data-section') === activeId;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.id);
          }
        });
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0.05 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  // 5. Resume button placeholder notice
  const resumeBtn = document.getElementById('resume-btn');
  const resumeNotice = document.getElementById('resume-notice');
  const dismissResumeNotice = document.getElementById('dismiss-resume-notice');

  resumeBtn?.addEventListener('click', (event) => {
    const href = resumeBtn.getAttribute('href');
    if (!href || href === '#') {
      event.preventDefault();
      resumeNotice?.classList.remove('hidden');
    }
  });

  dismissResumeNotice?.addEventListener('click', () => {
    resumeNotice?.classList.add('hidden');
  });

  // 6. Resilient image fallbacks (hero portrait & project thumbnails)
  const heroImg = document.getElementById('hero-portrait-img');
  const heroFallback = document.getElementById('hero-portrait-fallback');
  heroImg?.addEventListener('error', () => {
    heroImg.classList.add('hidden');
    heroFallback?.classList.remove('hidden');
  });

  document.querySelectorAll('.project-thumb img').forEach((img) => {
    img.addEventListener('error', () => {
      img.classList.add('hidden');
      img.parentElement?.querySelector('.thumb-fallback')?.classList.remove('hidden');
    });
  });

  // 7. Project domain filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedFilter = button.getAttribute('data-filter') || 'all';

      filterButtons.forEach((btn) => {
        const isActive = btn === button;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });

      projectCards.forEach((card) => {
        const cardCategory = card.getAttribute('data-category');
        const shouldShow = selectedFilter === 'all' || cardCategory === selectedFilter;
        card.classList.toggle('hidden', !shouldShow);
      });
    });
  });

  // 8. Project detail modal
  const modal = document.getElementById('project-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCloseFooter = document.getElementById('modal-close-footer');
  const modalCategory = document.getElementById('modal-category');
  const modalTitle = document.getElementById('modal-title');
  const modalImg = document.getElementById('modal-img');
  const modalOverview = document.getElementById('modal-overview');
  const modalProblem = document.getElementById('modal-problem');
  const modalFeatures = document.getElementById('modal-features');
  const modalTech = document.getElementById('modal-tech');
  const modalGithubLink = document.getElementById('modal-github-link');

  const closeModal = () => {
    modal?.classList.add('hidden');
  };

  const openModal = (projectId, triggerCard) => {
    const data = PROJECT_DETAILS[projectId];
    if (!data || !modal) return;

    if (modalCategory) modalCategory.textContent = data.category;
    if (modalTitle) modalTitle.textContent = data.title;
    if (modalOverview) modalOverview.textContent = data.overview;
    if (modalProblem) modalProblem.textContent = data.problem;
    if (modalTech) modalTech.textContent = data.tech;

    const sourceImg = triggerCard?.querySelector('.project-thumb img');
    if (modalImg && sourceImg) {
      modalImg.setAttribute('src', sourceImg.getAttribute('src') || '');
      modalImg.setAttribute('alt', sourceImg.getAttribute('alt') || data.title);
    }

    if (modalFeatures) {
      modalFeatures.innerHTML = '';
      data.features.forEach((feat) => {
        const li = document.createElement('li');
        li.textContent = feat;
        modalFeatures.appendChild(li);
      });
    }

    if (modalGithubLink) {
      if (data.githubUrl) {
        modalGithubLink.setAttribute('href', data.githubUrl);
        modalGithubLink.classList.remove('hidden');
      } else {
        modalGithubLink.classList.add('hidden');
      }
    }

    modal.classList.remove('hidden');
    modalCloseBtn?.focus();
  };

  document.querySelectorAll('[data-open-project]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const projectId = btn.getAttribute('data-open-project');
      const card = btn.closest('.project-card');
      if (projectId) openModal(projectId, card);
    });
  });

  modalCloseBtn?.addEventListener('click', closeModal);
  modalCloseFooter?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // 9. Copy email to clipboard
  const copyBtn = document.getElementById('copy-email-btn');
  const copyText = document.getElementById('copy-email-text');

  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('korashiabir@gmail.com');
      if (copyText) copyText.textContent = 'Copied';
      setTimeout(() => {
        if (copyText) copyText.textContent = 'Copy';
      }, 2500);
    } catch {
      if (copyText) copyText.textContent = 'Copy';
    }
  });

  // 10. Contact form validation + backend /api/contact integration + direct email fallbacks
  const contactForm = document.getElementById('contact-form');
  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const messageInput = document.getElementById('contact-message');
  const nameError = document.getElementById('contact-name-error');
  const emailError = document.getElementById('contact-email-error');
  const messageError = document.getElementById('contact-message-error');
  const submitBtn = document.getElementById('contact-submit-btn');
  const submitText = document.getElementById('contact-submit-text');
  const formFeedback = document.getElementById('form-feedback');
  const feedbackTitle = document.getElementById('form-feedback-title');
  const feedbackBody = document.getElementById('form-feedback-body');
  const feedbackActions = document.getElementById('form-feedback-actions');
  const mailtoFallback = document.getElementById('mailto-fallback');
  const gmailFallback = document.getElementById('gmail-fallback');

  const setFieldError = (input, errorEl, message) => {
    if (!input || !errorEl) return;
    if (message) {
      input.classList.add('input-error');
      input.setAttribute('aria-invalid', 'true');
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    } else {
      input.classList.remove('input-error');
      input.removeAttribute('aria-invalid');
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  };

  const showFeedback = ({ variant, title, body, showActions, nameVal, emailVal, messageVal }) => {
    if (!formFeedback || !feedbackTitle || !feedbackBody) return;
    formFeedback.classList.remove('hidden', 'feedback-success', 'feedback-error');
    if (variant === 'success') formFeedback.classList.add('feedback-success');
    if (variant === 'error') formFeedback.classList.add('feedback-error');

    feedbackTitle.textContent = title;
    feedbackBody.textContent = body;

    if (feedbackActions) {
      feedbackActions.classList.toggle('hidden', !showActions);
    }

    if (showActions && nameVal && emailVal && messageVal) {
      const subject = encodeURIComponent(`Portfolio Inquiry from ${nameVal}`);
      const encodedBody = encodeURIComponent(`${messageVal}\n\nFrom: ${nameVal} (${emailVal})`);
      mailtoFallback?.setAttribute(
        'href',
        `mailto:korashiabir@gmail.com?subject=${subject}&body=${encodedBody}`
      );
      gmailFallback?.setAttribute(
        'href',
        `https://mail.google.com/mail/?view=cm&fs=1&to=korashiabir@gmail.com&su=${subject}&body=${encodedBody}`
      );
    }
  };

  [
    [nameInput, nameError],
    [emailInput, emailError],
    [messageInput, messageError],
  ].forEach(([input, errorEl]) => {
    input?.addEventListener('input', () => {
      setFieldError(input, errorEl, '');
      formFeedback?.classList.add('hidden');
    });
  });

  contactForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nameVal = nameInput?.value.trim() || '';
    const emailVal = emailInput?.value.trim() || '';
    const messageVal = messageInput?.value.trim() || '';

    let hasErrors = false;

    if (nameVal.length < 2) {
      setFieldError(nameInput, nameError, 'Please enter your name (at least 2 characters).');
      hasErrors = true;
    } else {
      setFieldError(nameInput, nameError, '');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      setFieldError(emailInput, emailError, 'Please enter a valid email address.');
      hasErrors = true;
    } else {
      setFieldError(emailInput, emailError, '');
    }

    if (messageVal.length < 10) {
      setFieldError(
        messageInput,
        messageError,
        'Please enter a message of at least 10 characters.'
      );
      hasErrors = true;
    } else {
      setFieldError(messageInput, messageError, '');
    }

    if (hasErrors) {
      formFeedback?.classList.add('hidden');
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Sending...';

    try {
      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        {
          name: nameVal,
          from_name: nameVal,
          email: emailVal,
          from_email: emailVal,
          reply_to: emailVal,
          message: messageVal,
          to_name: 'Abir Korashi',
          to_email: 'korashiabir@gmail.com',
        },
        { publicKey: EMAILJS_CONFIG.publicKey }
      );

      showFeedback({
        variant: 'success',
        title: 'Message sent successfully',
        body: 'Thank you for reaching out! Your message has been sent directly to korashiabir@gmail.com.',
        showActions: false,
      });
      contactForm.reset();
    } catch (error) {
      const errorDetail =
        error && typeof error === 'object' && 'text' in error && typeof error.text === 'string'
          ? ` (${error.text})`
          : '';
      showFeedback({
        variant: 'error',
        title: 'Could not send message automatically',
        body: `Email delivery encountered an issue${errorDetail}. You can send your message directly using your email app or Gmail:`,
        showActions: true,
        nameVal,
        emailVal,
        messageVal,
      });
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Send Message';
    }
  });
});
