const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./blog.db'); // Create or open the database

// Create tables
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT, password TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, title TEXT, content TEXT, image TEXT, publishDate TEXT, userId INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY, postId INTEGER, content TEXT, userId INTEGER)");
});

module.exports = db;
