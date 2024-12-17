const token = localStorage.getItem("token");

// Extract blog ID from the URL
const blogId = decodeURI(location.pathname.split("/").pop());

document.addEventListener("DOMContentLoaded", () => {
    fetchRandomPosts();
    fetchComments();

    const commentForm = document.getElementById("comment-form");
    commentForm.addEventListener("submit", (event) => {
        event.preventDefault();
        postComment();
    });
});

// Fetch and display random posts
const fetchRandomPosts = () => {
    fetch(`/posts/random?excludeId=${blogId}`)
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then((data) => {
            if (data.length) {
                populateReadMoreSection(data);
            } else {
                console.warn("No random posts returned from server.");
            }
        })
        .catch((error) => {
            console.error("Error fetching random posts:", error);
            const blogsSection = document.querySelector(".blogs-section");
            blogsSection.innerHTML = "<p>Unable to load random posts at this time.</p>";
        });
};

// Populate the "Read More" section
const populateReadMoreSection = (posts) => {
    const blogsSection = document.querySelector(".blogs-section");
    blogsSection.innerHTML = ""; // Clear existing content

    posts.forEach((post) => {
        const postElement = document.createElement("div");
        postElement.classList.add("blog-card");
        postElement.innerHTML = `
            <img src="${post.image || '/img/default.jpg'}" class="blog-image" alt="Post image">
            <h3 class="blog-title">${post.title}</h3>
            <p class="blog-overview">${post.content.slice(0, 100)}...</p>
            <a href="/post/${post.id}" class="btn dark">Read More</a>
        `;
        blogsSection.appendChild(postElement);
    });
};

// Fetch comments for the post
const fetchComments = () => {
    fetch(`/posts/${blogId}/comments`)
        .then((response) => {
            if (!response.ok) throw new Error(`Failed to fetch comments.`);
            return response.json();
        })
        .then((data) => {
            if (data.error) throw new Error(data.error);
            populateComments(data);
        })
        .catch((error) => {
            console.error("Error fetching comments:", error);
        });
};

// Post a new comment
const postComment = () => {
    const content = document.getElementById("comment-input").value.trim();

    if (!content) {
        alert("Comment cannot be empty.");
        return;
    }

    fetch("/comments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId: blogId, content }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) throw new Error(data.error);

            document.getElementById("comment-input").value = ""; // Clear input
            fetchComments(); // Refresh comment list
        })
        .catch((error) => {
            console.error("Error posting comment:", error);
            alert(error.message);
        });
};

// Populate comments on the page
const populateComments = (comments) => {
    const commentsList = document.getElementById("comments-list");
    commentsList.innerHTML = ""; // Clear existing comments

    comments.forEach((comment) => {
        const commentElement = document.createElement("div");
        commentElement.classList.add("comment");
        commentElement.innerHTML = `
            <h3 class="comment-author">Posted by: <span class="author-email">${comment.email}</span></h3>
            <p class="comment-content">${comment.content}</p>
        `;
        commentsList.appendChild(commentElement);
    });
};
