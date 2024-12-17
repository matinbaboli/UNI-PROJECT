document.addEventListener("DOMContentLoaded", () => {
    const postsList = document.querySelector(".posts-list ul");
    const dashboardContent = document.querySelector(".admin-dashboard-content");
    const addPostButton = document.querySelector(".add-post");
    const token = localStorage.getItem("token");

    // Protect the admin page: Redirect if not logged in
    if (!token) {
        alert("You must be logged in to access the admin dashboard.");
        window.location.href = "/login.html";
        return;
    }

    // Fetch posts for the authenticated user
    const fetchPosts = () => {
        fetch("/user/posts", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((response) => response.json())
            .then((posts) => {
                postsList.innerHTML = ""; // Clear current list

                posts.forEach((post) => {
                    const listItem = document.createElement("li");
                    listItem.classList.add("post");
                    const shortenedTitle =
                        post.title.length > 15
                            ? `${post.title.substring(0, 15)}...`
                            : post.title;

                    listItem.innerHTML = `
                        <img src="${post.image}" alt="Post Image" />
                        <h3 class="post-title">${shortenedTitle}</h3>
                    `;
                    listItem.addEventListener("click", () => showPostDetails(post));
                    postsList.appendChild(listItem);
                });
            })
            .catch((err) => {
                console.error("Error fetching posts:", err);
                alert("Failed to load posts.");
            });
    };

    // Function to display post details
    const showPostDetails = (post) => {
        dashboardContent.innerHTML = `
            <img src="${post.image}" alt="Post Details Image" class="selected-post-image" />
            <div class="selected-post-text-container">
                <h2 class="post-title">${post.title}</h2>
                <p class="post-content">${post.content}</p>
            </div>
            <div class="post-actions">
                <button class="btn dark">Delete</button>
                <button class="btn dark">Edit</button>
            </div>
        `;

        // Assign delete button functionality
        dashboardContent.querySelector(".btn.dark:nth-child(1)").onclick = () =>
            deletePost(post.id);

        // Assign edit button functionality
        dashboardContent.querySelector(".btn.dark:nth-child(2)").onclick = () => {
            window.location.href = `/editor.html?postId=${post.id}`;
        };

        // Adjust scroll for smaller screens
        if (window.innerWidth < 600) window.scrollTo(0, 650);
    };

    // Function to delete a post
    const deletePost = (postId) => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        fetch(`/posts/${postId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((response) => {
                if (!response.ok) throw new Error("Failed to delete post.");
                alert("Post deleted successfully.");
                fetchPosts(); // Refresh the post list
            })
            .catch((err) => {
                console.error("Error deleting post:", err);
                alert("Failed to delete post.");
            });

        dashboardContent.innerHTML = `<h1 class="heading dark"><span class="small">Manage your</span> <span class="no-fill dark">posts</span></h1>`
    };

    // Initial fetch for posts
    fetchPosts();
});
