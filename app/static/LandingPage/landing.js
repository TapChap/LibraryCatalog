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
    
    document.querySelectorAll('.eye-icon').forEach(toggle => {
        toggle.addEventListener('click', function () {
            const wrapper = this.closest('.password-wrapper');
            const input_field = wrapper.querySelector('input')
            
            if (!input_field) return; // fail-safe
            
            const isPassword = input_field.type === 'password';
            input_field.type = isPassword ? 'text' : 'password';
            
            this.innerHTML = isPassword ?
                `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>`
                :
                `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" stroke-dasharray="2 2" />
                    <circle cx="12" cy="12" r="3" />
                    <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" stroke-width="2" />
                </svg>`
            ;
        });
    });
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        const container = document.getElementById('container');
        if (container.classList.contains("right-panel-active")) {
            handleSignup();
        } else {
            handleLogin();
        }
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
        window.location.href = '/home';
    } else {
        alert(data.message);
    }
}

async function handleLogin(username="", pass="") {
    const usernameField = document.getElementById("login_username").value || username;
    const passwordField = document.getElementById("login_password").value || pass;
    
    const response = await fetch(`http://${window.CONFIG.SERVER_URL}/user/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"username": usernameField, "password": passwordField}),
    });
    
    const data = await response.json();
    if (response.ok) {
        console.log("log-in successful");
        sessionStorage.setItem('libraryUser', JSON.stringify(data.user));
        window.location.href = '/home';
    } else {
        alert(data.message);
    }
}