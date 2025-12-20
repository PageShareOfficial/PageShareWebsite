// ============================================
// PageShare - Blog Post Page JavaScript
// ============================================

// Get blog ID from URL
const urlParams = new URLSearchParams(window.location.search);
const blogId = urlParams.get('id');

// Load and display blog post
function loadBlogPost() {
    if (!blogId) {
        document.getElementById('blogPost').innerHTML = `
            <div class="blog-post-header">
                <h1 class="blog-post-title">Blog Not Found</h1>
                <p>Sorry, the blog post you're looking for doesn't exist.</p>
                <a href="index.html" class="back-to-blogs">Back to Blogs</a>
            </div>
        `;
        return;
    }

    // Get blogs from localStorage
    const blogs = JSON.parse(localStorage.getItem('pageShare_blogs') || '[]');
    
    // Find the blog with matching ID
    const blog = blogs.find(b => b.id === blogId);
    
    if (!blog) {
        document.getElementById('blogPost').innerHTML = `
            <div class="blog-post-header">
                <h1 class="blog-post-title">Blog Not Found</h1>
                <p>Sorry, the blog post you're looking for doesn't exist.</p>
                <a href="index.html" class="back-to-blogs">Back to Blogs</a>
            </div>
        `;
        return;
    }

    // Format content (convert line breaks to paragraphs)
    let formattedContent = blog.content
        .replace(/\n\n+/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    formattedContent = '<p>' + formattedContent + '</p>';

    // Build tags HTML
    const tagsHTML = blog.tags && blog.tags.length > 0
        ? `<div class="blog-post-tags">
            ${blog.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
           </div>`
        : '';

    // Display blog post
    document.getElementById('blogPost').innerHTML = `
        <header class="blog-post-header">
            <h1 class="blog-post-title">${blog.title}</h1>
            <div class="blog-post-meta">
                <span class="blog-post-author">${blog.author}</span>
                <span class="blog-post-date">${blog.date}</span>
            </div>
            ${tagsHTML}
        </header>
        <div class="blog-post-body">
            ${formattedContent}
        </div>
        <footer class="blog-post-footer">
            <a href="index.html" class="back-to-blogs">← Back to All Blogs</a>
        </footer>
    `;

    // Update page title
    document.title = `${blog.title} - PageShare`;
}

// Load blog post on page load
loadBlogPost();

