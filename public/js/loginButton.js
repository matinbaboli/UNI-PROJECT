const placeForButtonInNavbar = document.getElementById("login-button-list-item");
const placeForButtonInHomepageHeader = document.getElementById("home-header-section");
const authenticated = localStorage.getItem("token");

function createButton(text, href, className) {
    const button = document.createElement("a");
    button.href = href;
    button.textContent = text;
    button.classList.add("btn");
    if (className) button.classList.add(className);
    return button;
}

const logoutButton = document.createElement("button")
logoutButton.textContent = "Log Out"
logoutButton.classList.add("btn")
logoutButton.classList.add("dark")
logoutButton.style.fontSize = "inherit"
logoutButton.addEventListener("click", () => {
    localStorage.removeItem("token")
    window.location.href = '/';
})



const text = authenticated ? "Manage Posts" : "Log In";
const href = authenticated ? "/admin.html" : "/login.html";

let isInAdmin = window.location.pathname === "/admin.html" 

// const NavbarButton = isInAdmin ? createButton(text, href, "dark") : logoutButton;
const NavbarButton = isInAdmin ? logoutButton : createButton(text, href, "dark");
const homepageHeaderButton = createButton(text, href);



document.addEventListener("DOMContentLoaded", () => {
    placeForButtonInNavbar.append(NavbarButton);
    placeForButtonInHomepageHeader && placeForButtonInHomepageHeader.append(homepageHeaderButton);
})