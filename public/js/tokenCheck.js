// Function to check if the token is expired
function isTokenExpired(token) {
    try {
        const decoded = JSON.parse(atob(token.split('.')[1]));  // Decode the token
        const currentTime = Date.now() / 1000;  // Get current time in seconds
        return decoded.exp < currentTime;  // Return true if expired
    } catch (error) {
        console.error("Failed to decode token:", error);
        return true;  // If token decoding fails, assume expired
    }
}

// check and redirect if token is expired
const token = localStorage.getItem("token");

if (token && isTokenExpired(token)) {
    alert("Your session has expired. Please log in again.");
    window.location.href = "/login.html";
}
