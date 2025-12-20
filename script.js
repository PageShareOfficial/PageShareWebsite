// ============================================
// PageShare - Interactive JavaScript
// ============================================

// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const nav = document.querySelector('.nav');
const headerActions = document.querySelector('.header-actions');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        nav.classList.toggle('mobile-active');
        headerActions.classList.toggle('mobile-active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
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

// Newsletter Form Submission
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = newsletterForm.querySelector('.form-input');
        const email = emailInput.value;
        
        if (email) {
            // Here you would typically send the email to your backend
            alert(`Thank you for subscribing! We'll send updates to ${email}`);
            emailInput.value = '';
        }
    });
}

// Load More Button Functionality
const loadMoreBtn = document.querySelector('.btn-load-more');
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
        // This would typically load more blog posts from your backend
        alert('Loading more stories...');
        // You can add AJAX/fetch logic here to load more content
    });
}

// Header Scroll Effect
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.7)';
    } else {
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.5)';
    }
    
    lastScroll = currentScroll;
});

// Intersection Observer for Fade-in Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe blog cards
document.querySelectorAll('.blog-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(card);
});

// Button Click Animations
document.querySelectorAll('button, .btn-primary, .btn-secondary, .btn-hero-primary, .btn-hero-secondary').forEach(button => {
    button.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add ripple effect styles dynamically
const style = document.createElement('style');
style.textContent = `
    button, .btn-primary, .btn-secondary, .btn-hero-primary, .btn-hero-secondary {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @media (max-width: 968px) {
        .nav.mobile-active {
            display: block;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: #000000;
            border-top: 2px solid #FFFFFF;
            padding: 20px;
        }
        
        .nav.mobile-active .nav-list {
            flex-direction: column;
            gap: 20px;
            align-items: flex-start;
        }
        
        .header-actions.mobile-active {
            display: flex;
            flex-direction: column;
            gap: 15px;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: #000000;
            border-top: 2px solid #FFFFFF;
            padding: 20px;
            margin-top: 60px;
        }
        
        .mobile-menu-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(8px, 8px);
        }
        
        .mobile-menu-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-menu-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
        }
    }
`;
document.head.appendChild(style);

// Form Input Focus Effects
document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.borderColor = '#FFFFFF';
        this.parentElement.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.borderColor = '#FFFFFF';
        this.parentElement.style.boxShadow = 'none';
    });
});

// Social Links Hover Effect Enhancement
document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) rotate(10deg) scale(1.1)';
    });
    
    link.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) rotate(0) scale(1)';
    });
});

// Load and display blogs from localStorage
function loadBlogs() {
    const blogsGrid = document.getElementById('blogsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!blogsGrid) return;
    
    // Get blogs from localStorage
    const blogs = JSON.parse(localStorage.getItem('pageShare_blogs') || '[]');
    
    if (blogs.length === 0) {
        blogsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    blogsGrid.style.display = 'grid';
    blogsGrid.innerHTML = '';
    
    // Display each blog
    blogs.forEach(blog => {
        const blogCard = document.createElement('article');
        blogCard.className = 'blog-card';
        blogCard.onclick = () => {
            window.location.href = `blog.html?id=${blog.id}`;
        };
        
        const tagsHTML = blog.tags && blog.tags.length > 0
            ? `<div class="blog-tags">
                ${blog.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
               </div>`
            : '';
        
        blogCard.innerHTML = `
            <div class="blog-card-image">
                <div class="blog-placeholder"></div>
            </div>
            <div class="blog-card-content">
                <div class="blog-meta">
                    <span class="blog-author">${blog.author}</span>
                    <span class="blog-date">${blog.date}</span>
                </div>
                <h3 class="blog-title">${blog.title}</h3>
                <p class="blog-excerpt">${blog.excerpt}</p>
                ${tagsHTML}
                <a href="blog.html?id=${blog.id}" class="blog-read-more" onclick="event.stopPropagation()">Read More →</a>
            </div>
        `;
        
        blogsGrid.appendChild(blogCard);
    });
    
    // Re-observe new blog cards for animations
    document.querySelectorAll('.blog-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(card);
    });
}

// Load blogs on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBlogs);
} else {
    loadBlogs();
}

// Reload blogs when returning to page (in case new blog was published)
window.addEventListener('focus', loadBlogs);

// Blog Card Click Tracking (for analytics)
document.addEventListener('click', function(e) {
    const blogCard = e.target.closest('.blog-card');
    if (blogCard) {
        const title = blogCard.querySelector('.blog-title')?.textContent;
        if (title) {
            console.log(`Blog clicked: ${title}`);
            // You can add analytics tracking here
        }
    }
});

// Console Welcome Message
console.log('%cPageShare', 'font-size: 24px; font-weight: bold; color: #000000;');
console.log('%cWelcome to PageShare - Your Blogging Platform', 'font-size: 14px; color: #000000;');

