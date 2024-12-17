const blogSection = document.querySelector('.blogs-section');

// Fetch all blogs from the backend
fetch('/posts')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch blogs');
        }
        return response.json();
    })
    .then(blogs => {
        blogs.forEach(blog => {
            createBlog(blog);
        });
    })
    .catch(error => {
        console.error('Error:', error);
        blogSection.innerHTML = '<p class="error-message">Failed to load posts. Please try again later.</p>';
    });

// Function to create and display a blog card
const createBlog = (blog) => {
    blogSection.innerHTML += `
    <div class="blog-card">
        <img src="${blog.image}" class="blog-image" alt="">
        <h1 class="blog-title">${blog.title.substring(0, 100) + '...'}</h1>
        <p class="blog-overview">${blog.content.substring(0, 200) + '...'}</p>
        <a href="/post/${blog.id}" class="btn dark">read</a>
    </div>
    `;
};
