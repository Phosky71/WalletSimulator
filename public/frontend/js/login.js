window.onload = function () {
    // checkAuthentication();
    const loginButton = document.querySelector("#loginButton");
    const registerButton = document.querySelector("#registerButton");
    const showRegisterLink = document.querySelector("#showRegisterFormLink");
    const showLoginLink = document.querySelector("#showLoginFormLink");

    loginButton.addEventListener('click', login);
    registerButton.addEventListener('click', register);
    showRegisterLink.addEventListener('click', function (event) {
        event.preventDefault();
        showRegisterForm();
    });
    showLoginLink.addEventListener('click', function (event) {
        event.preventDefault();
        showLoginForm();
    });
};

function showRegisterForm() {
    clearForm('loginForm');
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLoginForm() {
    clearForm('registerForm');
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

function clearForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = '';
    }
}


async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    if (email && password) {
        document.getElementById('loadingModal').style.display = 'block';
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({email, password}),
            credentials: 'include'
        });
        setTimeout(function () {
            document.getElementById('loadingModal').style.display = 'none';
        }, 3000);
        if (response.ok) {
            await fetchUserSettings();
            // await updateTotalBalance();
            window.location.href = '/frontend/html/portfolio.html';
        } else {
            setTimeout(async function () {
                const errorData = await response.json();
                if (response.status === 400) {
                    document.getElementById('errorModalContent').textContent = 'Invalid email or password';
                } else {
                    document.getElementById('errorModalContent').textContent = errorData.msg;
                }
                $('#errorModal').modal('show');
            }, 1500);
        }
    } else {
        return {status: 'error', message: 'Please fill in all fields'};
    }
}

// Inicializa los modales para que no se puedan cerrar manualmente
// $('#loadingModal').modal({backdrop: 'static', keyboard: false, show: false});
// $('#successModal').modal({backdrop: 'static', keyboard: false, show: false});
// $('#errorModal').modal({backdrop: 'static', keyboard: false, show: false});

async function register() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    // Comprobación del correo electrónico
    if (!email.includes('@')) {
        displayError('Invalid email');
        return;
    }

    const emailDomain = email.split('@')[1];
    const allowedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'alu.murciaeduca.es', 'aluold.murciaeduca.es'];
    if (!allowedDomains.includes(emailDomain)) {
        displayError('Invalid email domain');
        return;
    }
    if (username && email && password) {
        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // 'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify({username, email, password})
            });
            if (response.ok || response.status === 201) {
                const data = await response.json();
                localStorage.setItem('publicAddress', data.publicAddress);

                // Mostrar modal con check
                $('#successModal').modal('show');

                // Esperar 2 segundos, luego ocultar el modal y mostrar el formulario de inicio de sesión
                setTimeout(function () {
                    $('#successModal').modal('hide');
                    showLoginForm();
                }, 2000);
            } else {
                // Si la respuesta no es exitosa, muestra el modal de error
                const errorData = await response.json();
                document.getElementById('errorModalContent').textContent = errorData.msg;
                $('#errorModal').modal('show');
            }
        } catch (error) {
            displayError('Registration failed. Please try again.');
        }
    } else {
        displayError('Please fill in all fields');
    }
}

function displayError(message) {
    const errorElement = document.getElementById('registerError');
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Después de 3 segundos, ocultar el mensaje de error
    setTimeout(function () {
        errorElement.style.display = 'none';
    }, 3000); // 3000 milisegundos = 3 segundos
}

async function logout() {
    const response = await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include'
    });
    if (response.ok) {
        // Redirigir al usuario a la página de inicio de sesión
        window.location.href = '/frontend/html/login.html';
    } else {
        console.error('Failed to log out');
    }
}


// function checkAuthentication() {
//     const token = localStorage.getItem('token');
//     if (!token) {
//         // Redirige al usuario a la página de inicio de sesión
//         window.location.href = '/frontend/html/login.html';
//     }
// }

async function fetchUserSettings() {
    const token = await getToken();
    const response = await fetch('/api/users/settings', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        const settings = await response.json();
        applyUserSettings(settings);
    } else {
        console.error('Failed to fetch user settings');
    }
}

function applyUserSettings(settings) {
    // Apply settings to the UI
    if (settings.autoAddCrypto !== undefined) {
        document.getElementById('autoAddCrypto').checked = settings.autoAddCrypto;
    }
    // Add more settings as needed
}

async function getToken() {
    try {
        const response = await fetch('/api/auth/token', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch token');
        }

        const {token} = await response.json();
        return token;
    } catch (error) {
        console.error('Error fetching token:', error);
        window.location.href = '/frontend/html/login.html';
    }
}


