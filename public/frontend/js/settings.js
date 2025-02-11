async function fetchUserDetails() {
    const token = await getToken();
    const response = await fetch('/api/users/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user details');
    }

    const userDetails = await response.json();
    document.getElementById('publicAddress').textContent = `Public Address: ${userDetails.publicAddress}`;
}


async function saveUserSettings(settings) {
    try {
        const token = await getToken();
        const response = await fetch('/api/settings/saveSettings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(settings)
        });

        if (!response.ok) {
            throw new Error('Failed to save user settings');
        }


        const data = await response.json();
        console.log('User settings saved:', data);
    } catch (error) {
        console.error('Failed to save user settings', error);
    }
}

document.getElementById('settingsModal').addEventListener('hidden.bs.modal', async function () {
    const settings = {
        autoAddCrypto: document.getElementById('autoAddCrypto').checked
    };

    await saveUserSettings(settings);
});

$('#settingsModal').on({
    'hidden.bs.modal': function () {
        saveUserSettings();
    },
    'show.bs.modal': fetchUserDetails
});

document.getElementById('settingsModal').addEventListener('show.bs.modal', fetchUserSettings);

async function fetchUserSettings() {
    const token = await getToken();
    const response = await fetch('/api/settings/getSettings', {
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

document.getElementById('logoutButton').addEventListener('click', async function () {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            document.cookie = 'token=; Max-Age=0; path=/;';
            window.location.href = '/frontend/html/login.html';
        } else {
            throw new Error('Failed to log out');
        }
        DF
    } catch (error) {
        console.error('Error logging out:', error);
    }
});

// public/frontend/js/settings.js
document.getElementById('deleteUserButton').addEventListener('click', async function () {
    if (confirm('Estás seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
        try {
            const token = await getToken();
            const response = await fetch('/api/users/me', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                window.location.href = '/frontend/html/login.html';
            } else {
                const errorData = await response.json();
                throw new Error(`Failed to delete user: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }
});

// function applyUserSettings(settings) {
//     if (settings.autoAddCrypto !== undefined) {
//         document.getElementById('autoAddCrypto').checked = settings.autoAddCrypto;
//     }
// }
