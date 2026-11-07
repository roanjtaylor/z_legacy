// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', function() {
      mobileMenuBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        mobileMenuBtn.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!mobileMenuBtn.contains(e.target) && !navLinks.contains(e.target)) {
        mobileMenuBtn.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });
  }
});

// Contact Form Handling
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  const successAlert = document.getElementById('successAlert');
  const errorAlert = document.getElementById('errorAlert');

  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      // Hide any existing alerts
      if (successAlert) successAlert.style.display = 'none';
      if (errorAlert) errorAlert.style.display = 'none';

      // Get form data
      const formData = new FormData(contactForm);
      const name = formData.get('name');
      const email = formData.get('email');
      const enquiryType = formData.get('enquiryType');
      const message = formData.get('message');

      // Basic validation
      if (!name || !email || !enquiryType || !message) {
        if (errorAlert) {
          errorAlert.style.display = 'block';
          errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (errorAlert) {
          errorAlert.textContent = 'Please enter a valid email address.';
          errorAlert.style.display = 'block';
          errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Simulate form submission success
      // In production, you would send this to a server or email service
      console.log('Form submitted:', {
        name: name,
        email: email,
        phone: formData.get('phone'),
        enquiryType: enquiryType,
        message: message
      });

      // Show success message
      if (successAlert) {
        successAlert.style.display = 'block';
        successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Reset form
      contactForm.reset();
    });
  }
});

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// Header scroll effect (optional - adds shadow on scroll)
document.addEventListener('DOMContentLoaded', function() {
  const header = document.querySelector('.header');

  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        header.style.boxShadow = '0 2px 16px rgba(0, 0, 0, 0.15)';
      } else {
        header.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      }
    });
  }
});
