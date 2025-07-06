document.addEventListener("DOMContentLoaded", function() {
    if (sessionStorage.getItem('libraryUser')) window.location.href = '/home';

    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');
    
    signUpButton.addEventListener('click', () => {
        container.classList.add("right-panel-active");
    });
    
    signInButton.addEventListener('click', () => {
        container.classList.remove("right-panel-active");
    });
});

document.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            if (container.classList.contains("right-panel-active")) handleSignup();
            else handleLogin();
        }
    });

async function handleSignup() {
    const username = document.getElementById("signup_username").value;
    const display_name = document.getElementById("signup_displayName").value;
    const password = document.getElementById("signup_password").value;

    const response = await fetch(`http://${window.CONFIG.SERVER_URL}/user/signup`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"username": username, "display_name": display_name, "password": password})
    });

    const data = await response.json();

    if (response.ok) {
        sessionStorage.setItem('libraryUser', JSON.stringify(data.user));
        window.location.href = '/home'; // Redirect to home page
    }
    else alert(data.message);
}

async function handleLogin(username="", pass="") {
    const usernameField = document.getElementById("login_username").value || username;
    const passwordField = document.getElementById("login_password").value || pass;

    const response = await fetch(`http://${window.CONFIG.SERVER_URL}/user/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"username": usernameField, "password": passwordField}),
    });

    data = await response.json();
    if (response.ok) {
        console.log("log-in successful");
        sessionStorage.setItem('libraryUser', JSON.stringify(data.user));
        window.location.href = '/home'; // Redirect to home page
    } else {
        alert(data.message);
    }
}