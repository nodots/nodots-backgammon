// Mobile Navigation
document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.querySelector('.hamburger')
  const navMenu = document.querySelector('.nav-menu')
  const navLinks = document.querySelectorAll('.nav-link')

  // Toggle mobile menu
  hamburger.addEventListener('click', function () {
    hamburger.classList.toggle('active')
    navMenu.classList.toggle('active')
  })

  // Close mobile menu when clicking on a link
  navLinks.forEach((link) => {
    link.addEventListener('click', function () {
      hamburger.classList.remove('active')
      navMenu.classList.remove('active')
    })
  })

  // Close mobile menu when clicking outside
  document.addEventListener('click', function (event) {
    const isClickInsideNav = navMenu.contains(event.target)
    const isClickOnHamburger = hamburger.contains(event.target)

    if (
      !isClickInsideNav &&
      !isClickOnHamburger &&
      navMenu.classList.contains('active')
    ) {
      hamburger.classList.remove('active')
      navMenu.classList.remove('active')
    }
  })
})

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault()

    const target = document.querySelector(this.getAttribute('href'))
    if (target) {
      const headerOffset = 80
      const elementPosition = target.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  })
})

// Navbar background on scroll
window.addEventListener('scroll', function () {
  const navbar = document.querySelector('.navbar')
  if (window.scrollY > 50) {
    navbar.style.background = 'rgba(255, 255, 255, 0.98)'
    navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)'
  } else {
    navbar.style.background = 'rgba(255, 255, 255, 0.95)'
    navbar.style.boxShadow = 'none'
  }
})

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
}

const observer = new IntersectionObserver(function (entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in-up')
    }
  })
}, observerOptions)

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function () {
  const animatedElements = document.querySelectorAll(
    '.feature-card, .tech-category, .stat-box'
  )
  animatedElements.forEach((el) => {
    observer.observe(el)
  })
})

// Simple contact form handling (if added later)
function handleContactForm(event) {
  event.preventDefault()

  // Here you would typically send the form data to a server
  // For now, just show a simple alert
  alert("Thank you for your interest! We'll get back to you soon.")
  event.target.reset()
}

// Board animation (simple hover effects)
document.addEventListener('DOMContentLoaded', function () {
  const boardPreview = document.querySelector('.board-preview')
  const points = document.querySelectorAll('.point')

  if (boardPreview) {
    boardPreview.addEventListener('mouseenter', function () {
      points.forEach((point, index) => {
        setTimeout(() => {
          point.style.transform = 'scale(1.05)'
          point.style.transition = 'transform 0.2s ease'
        }, index * 50)
      })
    })

    boardPreview.addEventListener('mouseleave', function () {
      points.forEach((point) => {
        point.style.transform = 'scale(1)'
      })
    })
  }
})

// Performance: Lazy loading for images (when added)
function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]')
  const imageObserver = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target
        img.src = img.dataset.src
        img.classList.remove('lazy')
        imageObserver.unobserve(img)
      }
    })
  })

  images.forEach((img) => imageObserver.observe(img))
}

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', lazyLoadImages)

// Keyboard navigation support
document.addEventListener('keydown', function (event) {
  // ESC key closes mobile menu
  if (event.key === 'Escape') {
    const hamburger = document.querySelector('.hamburger')
    const navMenu = document.querySelector('.nav-menu')

    if (navMenu.classList.contains('active')) {
      hamburger.classList.remove('active')
      navMenu.classList.remove('active')
    }
  }
})

// Simple analytics helper (for future integration)
function trackEvent(category, action, label) {
  // This would integrate with Google Analytics or similar
  console.log(`Event tracked: ${category} - ${action} - ${label}`)
}

// Track button clicks
document.addEventListener('DOMContentLoaded', function () {
  const ctaButtons = document.querySelectorAll('.btn-primary')
  ctaButtons.forEach((button) => {
    button.addEventListener('click', function () {
      trackEvent('CTA', 'Click', button.textContent.trim())
    })
  })
})

// Simple form validation helper
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Add loading states for buttons
function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true
    button.style.opacity = '0.7'
    button.innerHTML = button.innerHTML + ' <span>...</span>'
  } else {
    button.disabled = false
    button.style.opacity = '1'
    button.innerHTML = button.innerHTML.replace(' <span>...</span>', '')
  }
}
