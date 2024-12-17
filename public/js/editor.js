const blogTitleField = document.querySelector('.title');
const articleField = document.querySelector('.article');

// banner
const bannerImage = document.querySelector('#banner-upload');
const banner = document.querySelector(".banner");
let bannerPath; // To store uploaded banner path

const publishBtn = document.querySelector('.publish-btn');
const uploadInput = document.querySelector('#image-upload');

// Function to decode JWT and extract userId
function getUserId() {
    if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1])); // Decode the JWT token
        return decoded.userId;  // Assuming the JWT payload contains 'userId'
    }
    return null;
}


// Event listener for banner upload
bannerImage.addEventListener('change', () => {
    uploadImage(bannerImage, "banner");
});

// Event listener for inline image upload
uploadInput.addEventListener('change', () => {
    uploadImage(uploadInput, "image");
});

// Function to handle image uploads
const uploadImage = (uploadFile, uploadType) => {
    const [file] = uploadFile.files;
    if (file && file.type.includes("image")) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64String = reader.result.split(",")[1]; // Get only the base64 data

            fetch('/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64String }),
            })
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then((data) => {
                    if (uploadType === "image") {
                        addImage(data.imagePath, file.name);
                    } else {
                        bannerPath = `${location.origin}/${data.imagePath}`; // Set bannerPath
                        banner.style.backgroundImage = `url("${bannerPath}")`;
                    }
                })
                .catch((error) => {
                    console.error("Image upload failed:", error);
                    alert("Failed to upload image.");
                });
        };
    } else {
        alert("Please upload an image file.");
    }
};

// Function to insert image markdown into the article
const addImage = (imagePath, alt) => {
    let curPos = articleField.selectionStart;
    let textToInsert = `\r![${alt}](${imagePath})\r`;
    articleField.value =
        articleField.value.slice(0, curPos) + textToInsert + articleField.value.slice(curPos);
};

// Fetch post details if editing
const postId = new URLSearchParams(window.location.search).get('postId');
if (postId) {
    // Fetch existing post data
    fetch(`/posts/${postId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .then(post => {
            blogTitleField.value = post.title;
            articleField.value = post.content;
            banner.style.backgroundImage = `url("${post.image}")`;
            bannerPath = post.image;
        })
        .catch(err => {
            console.error("Error fetching post:", err);
            alert("Failed to load post.");
        });
}

// Publish button click event (Create or Edit post)
publishBtn.addEventListener('click', () => {
    if (articleField.value.trim() && blogTitleField.value.trim()) {
        const date = new Date();
        const publishDate = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
        const userId = getUserId()

        const postData = {
            title: blogTitleField.value,
            content: articleField.value,
            image: bannerPath, // Include the uploaded banner image path
            publishDate: publishDate,
            userId: userId
        };

        const method = postId ? "PUT" : "POST";
        const url = postId ? `/posts/${postId}` : '/posts';

        // Send request to create or update a post
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    location.href = postId ? `/post/${postId}` : `/post/${data.id}`;
                } else {
                    alert(data.message || "Failed to publish the blog. Please try again.");
                }
            })
            .catch(err => {
                console.error("Error creating/updating post:", err);
                alert("Failed to publish the blog. Please try again.");
            });
    } else {
        alert("Please fill in all fields before publishing.");
    }
});
