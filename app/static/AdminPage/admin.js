let currentUser = null;
let allUsers = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    // Get user info from sessionStorage
    const userData = sessionStorage.getItem('libraryUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        document.getElementById('admin-display').textContent = `שלום, ${currentUser.display_name || currentUser.username}`;

        // Check if user has admin permissions
        if (currentUser.permission !== 9) {
            showBookMessage('אין לכם הרשאות ניהול', 'error');
            setTimeout(() => {
                window.location.href = '/home';
            }, 2000);
            return;
        }

        loadAllUsers();
    } else {
        window.location.href = '/';
    }

    document.getElementById('system-update-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        await submitSystemUpdate();
    });

    document.getElementById('delete-update-btn').addEventListener('click', async function () {
        await deleteSystemUpdate();
    });
});

// Handle create book form submission
document.getElementById('create-book-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    await createBook();
});

async function createBook() {
    const form = document.getElementById('create-book-form');
    const createBtn = document.getElementById('create-btn');
    const formData = new FormData(form);

    // Separate required fields (JSON body) from optional fields (URL params)
    const requiredData = {};
    const urlParams = new URLSearchParams();

    for (let [key, value] of formData.entries()) {
        const trimmedValue = value.trim();

        if (key === 'book_name' || key === 'category') {
            // Required fields go in JSON body
            if (trimmedValue) {
                requiredData[key] = trimmedValue;
            }
        } else if (trimmedValue) {
            // Optional fields go as URL parameters
            if (key === 'series_index' || key === 'sub_cat_index') {
                urlParams.append(key, parseInt(trimmedValue));
            } else {
                urlParams.append(key, trimmedValue);
            }
        }
    }

    // Validate required fields
    if (!requiredData.book_name || !requiredData.category) {
        showBookMessage('אנא מלאו את כל השדות החובה', 'error');
        return;
    }

    createBtn.disabled = true;
    createBtn.textContent = 'יוצר...';

    try {
        // Build URL with parameters
        const url = `http://${window.CONFIG.SERVER_URL}/book/add?${urlParams.toString()}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requiredData)
        });

        const data = await response.json();

        if (response.ok) {
            showBookMessage(`הספר "${requiredData.book_name}" נוצר בהצלחה!`, 'success');
            form.reset();
        } else {
            showBookMessage(data.message || 'נכשל ביצירת הספר', 'error');
        }
    } catch (error) {
        console.error('Create book error:', error);
        showBookMessage('שגיאה בהתחברות לשרת', 'error');
    } finally {
        createBtn.disabled = false;
        createBtn.textContent = 'צור ספר';
    }
}

async function loadAllUsers() {
    const usersContainer = document.getElementById('users-container');

    try {
        const response = await fetch(`http://${window.CONFIG.SERVER_URL}/user/all`);
        const data = await response.json();

        if (response.ok) {
            allUsers = data

            displayUsers(allUsers);
        } else {
            showUsersMessage(data.message || 'נכשל בטעינת המשתמשים', 'error');
            usersContainer.innerHTML = '<div class="loading">שגיאה בטעינת המשתמשים</div>';
        }
    } catch (error) {
        console.error('Load users error:', error);
        showUsersMessage('שגיאה בהתחברות לשרת', 'error');
        usersContainer.innerHTML = '<div class="loading">שגיאה בהתחברות לשרת</div>';
    }
}

function displayUsers(users) {
    const usersContainer = document.getElementById('users-container');

    if (users.length === 0) {
        usersContainer.innerHTML = '<div class="loading">לא נמצאו משתמשים</div>';
        return;
    }

    const usersHTML = users.map(user => `
            <div class="user-card">
                <div class="user-name">${escapeHtml(user.display_name || user.username)}</div>
                <div class="user-info-detail">
                    <strong>משתמש:</strong> ${escapeHtml(user.username)} |
                    <strong>מזהה:</strong> ${user.id} |
                    <strong>הרשאה:</strong> ${user.permission === 9 ? 'מנהל' : 'משתמש רגיל'}
                </div>

                <div class="books-section">
                    <h4>ספרים בבעלות (${user.held_books ? user.held_books.length : 0}):</h4>
                    <div class="book-list">
                        ${user.held_books && user.held_books.length > 0 ?
        user.held_books.map(book => `
                                <div dir="rtl" class="book-item" onclick="removeBookFromUser(${user.id}, ${book.id}, '${escapeHtml(book.book_name)}', this)" title="לחץ להחזרת הספר">
                                    ${escapeHtml(book.book_name)}
                                </div>
                            `).join('') :
        '<div class="no-books">אין ספרים</div>'
    }
                    </div>
                </div>
            </div>
        `).join('');

    usersContainer.innerHTML = `<div class="users-grid">${usersHTML}</div>`;
}

async function removeBookFromUser(userId, bookId, bookName, element) {
    if (!confirm(`האם אתם בטוחים שברצונכם להחזיר את הספר "${bookName}"?`)) {
        return;
    }

    // Visual feedback
    element.style.opacity = '0.5';
    element.style.pointerEvents = 'none';

    try {
        const response = await fetch(`http://${window.CONFIG.SERVER_URL}/library/user/id/${userId}/return`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                book_id: bookId
            })
        });

        const data = await response.json();

        if (response.ok) {
            showUsersMessage(`הספר "${bookName}" הוחזר בהצלחה!`, 'success');
            // Reload users to get updated data
            await loadAllUsers();
        } else {
            showUsersMessage(data.message || 'נכשל בהחזרת הספר', 'error');
            // Restore element
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
        }
    } catch (error) {
        console.error('Remove book error:', error);
        showUsersMessage('שגיאה בהתחברות לשרת', 'error');
        // Restore element
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
    }
}

function showBookMessage(text, type) {
    const messageContainer = document.getElementById('book-message-container');
    messageContainer.innerHTML = `<div class="message ${type}">${escapeHtml(text)}</div>`;

    if (type === 'success') {
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }
}

function showUsersMessage(text, type) {
    const messageContainer = document.getElementById('users-message-container');
    messageContainer.innerHTML = `<div class="message ${type}">${escapeHtml(text)}</div>`;

    if (type === 'success') {
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }
}

async function submitSystemUpdate() {
    const form = document.getElementById('system-update-form');
    const submitBtn = document.getElementById('submit-update-btn');
    const deleteBtn = document.getElementById('delete-update-btn');
    const contentTextarea = document.getElementById('system-update-content');

    const content = contentTextarea.value.trim();

    if (!content) {
        alert('אנא הכנס תוכן להודעה', 'error');
        return;
    }

    // Disable buttons during request
    submitBtn.disabled = true;
    deleteBtn.disabled = true;
    submitBtn.textContent = 'שולח...';

    try {
        const response = await fetch(`http://${window.CONFIG.SERVER_URL}/system_update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('הודעת המערכת נשלחה בהצלחה!', 'success');
            contentTextarea.value = '';
        } else {
            alert(data.message || 'נכשל בשליחת ההודעה', 'error');
        }
    } catch (error) {
        console.error('Submit system update error:', error);
        alert('שגיאה בהתחברות לשרת', 'error');
    } finally {
        submitBtn.disabled = false;
        deleteBtn.disabled = false;
        submitBtn.textContent = 'שלח הודעה חדשה';
    }
}

async function deleteSystemUpdate() {
    if (!confirm('האם אתם בטוחים שברצונכם למחוק את הודעת המערכת הנוכחית?')) {
        return;
    }

    const submitBtn = document.getElementById('submit-update-btn');
    const deleteBtn = document.getElementById('delete-update-btn');

    // Disable buttons during request
    submitBtn.disabled = true;
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'מוחק...';

    try {
        const response = await fetch(`http://${window.CONFIG.SERVER_URL}/system_update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Empty content to trigger reset_system_update()
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('הודעת המערכת נמחקה בהצלחה!', 'success');
        } else {
            alert(data.message || 'נכשל במחיקת ההודעה', 'error');
        }
    } catch (error) {
        console.error('Delete system update error:', error);
        alert('שגיאה בהתחברות לשרת', 'error');
    } finally {
        submitBtn.disabled = false;
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'מחק הודעה קיימת';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function logout() {
    sessionStorage.removeItem('libraryUser');
    window.location.href = '/';
}

function goBack() {
    window.location.href = '/home';
}