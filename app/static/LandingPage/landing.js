function toggleForm() {
    const signup = document.getElementById("signup-container");
    const login = document.getElementById("login-container");
    signup.style.display = signup.style.display === "none" ? "block" : "none";
    login.style.display = login.style.display === "none" ? "block" : "none";
}

async function handleSignup() {
    const username = document.getElementById("signup-username").value;
    const display_name = document.getElementById("signup-display").value;
    const password = document.getElementById("signup-password").value;

    const response = await fetch(`http://${window.CONFIG.SERVER_URL}/user/signup`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"username": username, "display_name": display_name, "password": password})
    });

    const data = await response.json();

    if (response.ok) {
        await handleLogin(data.user.username, password);
    } else {
        alert(data.message);
    }
}

async function handleLogin(signupUsername="", signupPassword="") {
    const username = signupUsername || document.getElementById("login-username").value;
    const password = signupPassword || document.getElementById("login-password").value;

    console.log(signupUsername)
    console.log(signupPassword)

    const response = await fetch(`http://${window.CONFIG.SERVER_URL}/user/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"username": username, "password": password}),
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