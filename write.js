// ============================================
// PageShare - Blog Editor JavaScript
// ============================================

// Get DOM elements
const blogTitle = document.getElementById('blogTitle');
const blogAuthor = document.getElementById('blogAuthor');
const blogTags = document.getElementById('blogTags');
const blogContent = document.getElementById('blogContent');
const wordCount = document.getElementById('wordCount');
const charCount = document.getElementById('charCount');
const saveDraftBtn = document.getElementById('saveDraftBtn');
const publishBtn = document.getElementById('publishBtn');
const publishBtnBottom = document.getElementById('publishBtnBottom');
const previewBtn = document.getElementById('previewBtn');
const previewModal = document.getElementById('previewModal');
const closePreview = document.getElementById('closePreview');
const previewContent = document.getElementById('previewContent');

// Toolbar buttons
const boldBtn = document.getElementById('boldBtn');
const italicBtn = document.getElementById('italicBtn');
const headingBtn = document.getElementById('headingBtn');
const linkBtn = document.getElementById('linkBtn');
const listBtn = document.getElementById('listBtn');

// Word and character counter
function updateStats() {
    const text = blogContent.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    
    wordCount.textContent = `${words} words`;
    charCount.textContent = `${chars} characters`;
}

blogContent.addEventListener('input', updateStats);
blogTitle.addEventListener('input', updateStats);

// Format text functions
function formatText(command, value = null) {
    document.execCommand(command, false, value);
    blogContent.focus();
}

boldBtn.addEventListener('click', () => {
    formatText('bold');
    boldBtn.classList.toggle('active');
});

italicBtn.addEventListener('click', () => {
    formatText('italic');
    italicBtn.classList.toggle('active');
});

headingBtn.addEventListener('click', () => {
    formatText('formatBlock', '<h2>');
});

linkBtn.addEventListener('click', () => {
    const url = prompt('Enter URL:');
    if (url) {
        formatText('createLink', url);
    }
});

listBtn.addEventListener('click', () => {
    formatText('insertUnorderedList');
});

// Save draft to localStorage
function saveDraft() {
    const draft = {
        title: blogTitle.value,
        author: blogAuthor.value,
        tags: blogTags.value,
        content: blogContent.value,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('pageShare_draft', JSON.stringify(draft));
    
    // Show save confirmation
    const originalText = saveDraftBtn.textContent;
    saveDraftBtn.textContent = 'Saved!';
    saveDraftBtn.style.backgroundColor = '#000000';
    saveDraftBtn.style.color = '#FFFFFF';
    
    setTimeout(() => {
        saveDraftBtn.textContent = originalText;
        saveDraftBtn.style.backgroundColor = '';
        saveDraftBtn.style.color = '';
    }, 2000);
}

// Load draft from localStorage
function loadDraft() {
    const draft = localStorage.getItem('pageShare_draft');
    if (draft) {
        const data = JSON.parse(draft);
        blogTitle.value = data.title || '';
        blogAuthor.value = data.author || '';
        blogTags.value = data.tags || '';
        blogContent.value = data.content || '';
        updateStats();
    }
}

// Publish blog
function publishBlog() {
    const title = blogTitle.value.trim();
    const author = blogAuthor.value.trim();
    const tags = blogTags.value.trim();
    const content = blogContent.value.trim();
    
    if (!title || !content) {
        alert('Please fill in the title and content before publishing.');
        return;
    }
    
    if (!author) {
        alert('Please enter your name as the author.');
        return;
    }
    
    // Create blog object
    const blog = {
        id: Date.now().toString(),
        title: title,
        author: author || 'Anonymous',
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        content: content,
        excerpt: content.substring(0, 150) + '...',
        date: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        }),
        timestamp: new Date().toISOString()
    };
    
    // Get existing blogs
    let blogs = JSON.parse(localStorage.getItem('pageShare_blogs') || '[]');
    
    // Add new blog at the beginning
    blogs.unshift(blog);
    
    // Save to localStorage
    localStorage.setItem('pageShare_blogs', JSON.stringify(blogs));
    
    // Clear draft
    localStorage.removeItem('pageShare_draft');
    
    // Clear form
    blogTitle.value = '';
    blogAuthor.value = '';
    blogTags.value = '';
    blogContent.value = '';
    updateStats();
    
    // Show success message and redirect
    alert('Blog published successfully!');
    window.location.href = 'index.html';
}

// Preview functionality
function showPreview() {
    const title = blogTitle.value || 'Untitled';
    const author = blogAuthor.value || 'Anonymous';
    const tags = blogTags.value ? blogTags.value.split(',').map(t => t.trim()) : [];
    const content = blogContent.value || 'No content yet...';
    
    // Format content (basic markdown-like formatting)
    let formattedContent = content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    formattedContent = '<p>' + formattedContent + '</p>';
    
    previewContent.innerHTML = `
        <article class="preview-article">
            <header class="preview-header">
                <h1 class="preview-title">${title}</h1>
                <div class="preview-meta">
                    <span class="preview-author">${author}</span>
                    <span class="preview-date">${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                </div>
                ${tags.length > 0 ? `
                    <div class="preview-tags">
                        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </header>
            <div class="preview-body">
                ${formattedContent}
            </div>
        </article>
    `;
    
    previewModal.classList.add('active');
}

function closePreviewModal() {
    previewModal.classList.remove('active');
}

// Event listeners
saveDraftBtn.addEventListener('click', saveDraft);
publishBtn.addEventListener('click', publishBlog);
publishBtnBottom.addEventListener('click', publishBlog);
previewBtn.addEventListener('click', showPreview);
closePreview.addEventListener('click', closePreviewModal);

// Close modal when clicking outside
previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
        closePreviewModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && previewModal.classList.contains('active')) {
        closePreviewModal();
    }
});

// Auto-save draft every 30 seconds
setInterval(() => {
    if (blogTitle.value || blogContent.value) {
        saveDraft();
    }
}, 30000);

// Load draft on page load
loadDraft();

// Keyboard shortcuts
blogContent.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        formatText('bold');
    }
    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        formatText('italic');
    }
    // Ctrl/Cmd + S to save draft
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDraft();
    }
});

