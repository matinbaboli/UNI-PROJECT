const express = require('express');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');


const app = express();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '10mb' }));  // For handling JSON payloads

//middleware to protect routes that need authentication
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];;

    if (!token) {
        console.error("Authentication Error: Missing token");
        return res.status(403).json({ error: 'Token is required' });
    }

    jwt.verify(token, 'your-secret-key', (err, decoded) => {
        if (err) {
            console.error("Authentication Error: Invalid or expired token", err.message);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        console.log("Token Verified: Decoded payload", decoded);
        req.userId = decoded.userId;
        next();
    });
};




// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/editor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

// Route for uploading images (base64 format)
app.post('/upload', (req, res) => {
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) {
            return res.status(400).json({ error: "No image data provided" });
        }

        // Decode base64 image
        const buffer = Buffer.from(imageBase64, 'base64');
        if (!buffer) {
            return res.status(400).json({ error: "Invalid base64 data" });
        }

        const date = new Date();
        const imagename = `${date.getDate()}${date.getTime()}.jpeg`;

        // Process and compress the image using Sharp
        sharp(buffer)
            .resize(800) // Resize to a max width of 800px, preserving aspect ratio
            .jpeg({ quality: 80 }) // Compress to JPEG with 80% quality
            .toFile(path.join(uploadDir, imagename), (err) => {
                if (err) {
                    console.error("Sharp processing error:", err);
                    return res.status(500).json({ error: "Image processing failed" });
                }
                return res.json({ imagePath: `uploads/${imagename}` });
            });
    } catch (error) {
        console.error("Upload route error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Route to create a new post
app.post('/posts', authenticate, (req, res) => {
    try {
        const { title, content, image, publishDate } = req.body;
        const userId = req.userId; // Retrieved from middleware

        // Log request body and user ID
        console.log("Request Body:", req.body);
        console.log("Authenticated User ID:", userId);

        // Validate required fields
        if (!title || !content) {
            console.error("Validation Error: Title and content are required.");
            return res.status(400).json({ success: false, message: "Title and content are required." });
        }

        const defaultPublishDate = publishDate || new Date().toISOString();

        // Insert into the database
        db.run(
            "INSERT INTO posts (title, content, image, publishDate, userId) VALUES (?, ?, ?, ?, ?)",
            [title, content, image || null, defaultPublishDate, userId],
            function (err) {
                if (err) {
                    console.error("Database Error:", err.message);
                    return res.status(500).json({ success: false, message: "Failed to create post." });
                }

                console.log("Post Created with ID:", this.lastID);
                res.status(201).json({
                    success: true,
                    id: this.lastID, // ID of the newly inserted post
                });
            }
        );
    } catch (error) {
        console.error("Unexpected Error:", error.message);
        res.status(500).json({ success: false, message: "An unexpected error occurred." });
    }
});

// app.post('/posts', (req, res) => {

//     const { title, content, image, publishDate } = req.body;

//     if (!title || !content) {
//         return res.status(400).json({ success: false, message: "Title and content are required." });
//     }

//     const defaultPublishDate = publishDate || new Date().toString();

//     db.run(
//         "INSERT INTO posts (title, content, image, publishDate, userId) VALUES (?, ?, ?, ?, ?)",
//         [title, content, image || null, defaultPublishDate , null], // Assuming userId is not yet implemented
//         function (err) {
//             if (err) {
//                 console.error("Database error:", err.message);
//                 return res.status(500).json({ success: false, message: "Failed to create post." });
//             }

//             res.status(201).json({
//                 success: true,
//                 id: this.lastID, // ID of the newly inserted post
//             });
//         }
//     );
// });



// Route to fetch all posts
app.get('/posts', (req, res) => {
    db.all("SELECT * FROM posts", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);  // Send posts as JSON
    });
});

//Route for getting 4 random posts
app.get('/posts/random', (req, res) => {
    const excludeId = req.query.excludeId; // Get the current post ID from the query
    console.log("Random posts endpoint hit");

    let query = "SELECT * FROM posts WHERE id != ? ORDER BY RANDOM() LIMIT 4";
    let params = [excludeId || -1]; // Default to -1 if no excludeId is provided

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        if (rows.length === 0) {
            console.warn("No posts found in the database.");
            return res.status(404).json({ error: "No posts available" });
        }
        console.log("Random posts retrieved:", rows);
        res.json(rows);
    });
});

//Route to get posts for one user
app.get('/user/posts', authenticate, (req, res) => {
    const userId = req.userId; // Retrieved from authentication middleware

    db.all("SELECT * FROM posts WHERE userId = ?", [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);  // Send posts as JSON for the authenticated user
    });
});

// Signup route
app.post('/signup', (req, res) => {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ error: 'Error hashing password' });
        }

        // Save user to SQLite
        db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashedPassword], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Error creating user' });
            }

            // Generate JWT token using the last inserted user's ID
            const token = jwt.sign({ userId: this.lastID }, 'your-secret-key', { expiresIn: '1h' });
            res.status(201).json({ message: 'User created successfully', token });
        });
    });
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err || !row) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Compare password with the hash
        bcrypt.compare(password, row.password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign({ userId: row.id }, 'your-secret-key', { expiresIn: '1h' });
            res.json({ token });
        });
    });
});

// Get a single post by ID
app.get('/posts/:id', (req, res) => {
    const postId = req.params.id;

    const query = 'SELECT * FROM posts WHERE id = ?';
    db.get(query, [postId], (err, row) => {
        if (err) {
            console.error('Error retrieving post:', err);
            return res.status(500).json({ error: 'Failed to retrieve the post' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.status(200).json(row);
    });
});

//Route for editing a post
app.put('/posts/:id', authenticate, (req, res) => {
    const { title, content, image } = req.body;
    const postId = req.params.id;
    const userId = req.userId; // Retrieved from middleware

    if (!title && !content && !image) {
        return res.status(400).json({ message: 'At least one field must be provided to update the post.' });
    }

    db.get("SELECT * FROM posts WHERE id = ?", [postId], (err, post) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ message: "Failed to retrieve post." });
        }

        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }

        // Ensure the logged-in user can only edit their own posts
        if (post.userId !== userId) {
            return res.status(403).json({ message: "You are not allowed to edit this post." });
        }

        const updatedPost = {
            title: title || post.title,
            content: content || post.content, // Using 'content' here, but adjust if needed
            image: image || post.image,
        };

        db.run(
            "UPDATE posts SET title = ?, content = ?, image = ? WHERE id = ?",
            [updatedPost.title, updatedPost.content, updatedPost.image, postId],
            function (err) {
                if (err) {
                    console.error("Database error:", err.message);
                    return res.status(500).json({ message: "Failed to update post." });
                }

                res.status(200).json({
                    success: true,
                    message: "Post updated successfully.",
                    post: updatedPost,
                });
            }
        );
    });
});

//Route for deleting a post
app.delete('/posts/:id', authenticate, (req, res) => {
    const postId = req.params.id;
    const userId = req.userId; // Retrieved from middleware

    db.get("SELECT * FROM posts WHERE id = ?", [postId], (err, post) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ message: "Failed to retrieve post." });
        }

        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }

        // Ensure the logged-in user can only delete their own posts
        // if (post.userId !== userId) {
        //     return res.status(403).json({ message: "You are not allowed to delete this post." });
        // }

        db.run("DELETE FROM posts WHERE id = ?", [postId], function (err) {
            if (err) {
                console.error("Database error:", err.message);
                return res.status(500).json({ message: "Failed to delete post." });
            }

            res.status(200).json({ message: "Post deleted successfully." });
        });
    });
});


// Route to fetch a specific post by id and render blog.html with post data
app.get('/post/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM posts WHERE id = ?", [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Inject the post data into the blog.html template
        const blogHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Blog: ${row.title}</title>
                <link rel="stylesheet" href="/css/home.css">
                <link rel="stylesheet" href="/css/editor.css">
                <link rel="stylesheet" href="/css/blog.css">
            </head>
            <body>
                <nav class="navbar">
                    <img src="/img/logo.png" class="logo" alt="Logo">
                    <ul class="links-container">
                        <li class="link-item"><a href="/" class="link">Home</a></li>
                        <li id="login-button-list-item" class="link-item">
                        </li>
                    </ul>
                </nav>

                <div class="banner" style="background-image: url('${row.image}')"></div>

                <div class="blog">
                    <h1 class="title">${row.title}</h1>
                    <p class="published"><span>Published at: </span>${row.publishDate}</p>
                    <p class="article">
                        ${row.content}
                    </p>
                </div>

                <h1 class="sub-heading">Read More</h1>
                
                <section class="blogs-section">
                <!-- other blog content can go here -->
                </section>
                
                <h1 class="sub-heading">Comments</h1>
                <section class="comment-section">
                    <form id="comment-form">
                        <textarea id="comment-input" name="content" rows="4" placeholder="Leave a Comment..." required></textarea>
                        <button type="submit" class="btn dark">Post Comment</button>
                    </form>

                    <hr/>

                    <div id="comments-list">
                        <div class="comment">
                            <h3 class="comment-author">Posted by: <span class="author-email">user@example.com</span></h3>
                            <p class="comment-content">This is an example comment.</p>
                        </div>
                    </div>
                </section>

                
                <script src="/js/loginButton.js"></script>
                <script src="/js/blog.js"></script>
            </body>
            </html>
        `;

        res.send(blogHtml); // Send the dynamically created HTML content
    });
});

// Route to add a comment
app.post('/comments', authenticate, (req, res) => {
    const { postId, content } = req.body;

    if (!postId || !content) {
        return res.status(400).json({ error: "Post ID and content are required" });
    }

    const sql = "INSERT INTO comments (postId, content, userId) VALUES (?, ?, ?)";
    db.run(sql, [postId, content, req.userId], function (err) {
        if (err) {
            console.error("Error adding comment:", err.message);
            return res.status(500).json({ error: "Failed to add comment" });
        }
        res.status(201).json({ message: "Comment added successfully", commentId: this.lastID });
    });
});

// Route to fetch comments for a specific post
app.get('/posts/:id/comments', (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT comments.id, comments.content, comments.userId, users.email 
        FROM comments 
        JOIN users ON comments.userId = users.id 
        WHERE comments.postId = ? ORDER BY comments.id DESC
    `;
    db.all(sql, [id], (err, rows) => {
        if (err) {
            console.error("Error fetching comments:", err.message);
            return res.status(500).json({ error: "Failed to fetch comments" });
        }
        res.json(rows);
    });
});


app.get("/:blog", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json("404 Not Found");
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}...`);
});












