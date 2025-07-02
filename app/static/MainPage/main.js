let currentUser = null;
let heldBooks = [];
let allBooks = [];
let allUsers = [];
let totalBooksCount = 0;
let showingHeldBooks = false;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Get user info from sessionStorage
    const userData = sessionStorage.getItem('libraryUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        document.getElementById('user-display').textContent = `ברוכים הבאים, ${currentUser.display_name || currentUser.username}!`;
        console.log(currentUser)

        adminBttn = document.getElementById("admin");
        adminBttn.hidden = true;
        if (currentUser.permission === 9) {
            adminBttn.hidden = false;
        }

        loadHeldBooks(); // Load held books on page load
    }

    loadSystemMessage();

    Promise.all([loadAllBooks(), loadAllUsers()]).then((__)=> {
        showAllBooks();
        updateStats();
    })
});

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        searchBooks();
    }
}

async function showAllBooks() {
    try {
        console.log(allBooks)
        displayBooks(allBooks);
    } catch (error) {
        console.error('Search error:', error);
        showMessage('שגיאה בהצגת הספרים', 'error');
    }
}

async function searchBooks() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const messageContainer = document.getElementById('message-container');
    const booksContainer = document.getElementById('books-container');

    const bookName = searchInput.value.trim();

    if (!bookName) {
        showMessage('אנא הכניסו שם ספר לחיפוש', 'error');
        return;
    }

    // Show loading state
    searchBtn.disabled = true;
    searchBtn.textContent = 'מחפש...';
    booksContainer.innerHTML = '<div class="loading">מחפש ספרים...</div>';
    messageContainer.innerHTML = '';

    try {
        const response = await fetch(`http://${window.CONFIG.SERVER_URL}/book/${encodeURIComponent(escapeHtml(bookName))}`, {
            method: 'GET',
        });

        const data = await response.json();

        if (response.ok) {
            await displayBooks(data.books);
            if (data.books.length === 0) {
                showMessage('לא נמצאו ספרים עם השם הזה', 'info');
            } else {
                showMessage(`נמצאו ${data.books.length} ספר/ים`, 'success');
            }
        } else {
            showMessage(data.message || 'נכשל בחיפוש ספרים', 'error');
            booksContainer.innerHTML = '';
        }
    } catch (error) {
        console.error('Search error:', error);
        showMessage('שגיאה בהתחברות לשרת', 'error');
        booksContainer.innerHTML = '';
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = 'חפש ספרים';
    }
}

async function displayBooks(books, isHeldBooks = false, animate = true) {
    const booksContainer = document.getElementById('books-container');
    const motionStaggerDelay_ms = 75;

    if (books.length === 0) {
        const emptyMessage = isHeldBooks ? 'אין ספרים בבעלותכם כרגע' : 'לא נמצאו ספרים. נסו מונח חיפוש אחר.';
        booksContainer.innerHTML = `<div class="no-results">${emptyMessage}</div>`;
        return;
    }

    const titleHtml = isHeldBooks ? '<div class="section-title">הספרים שלכם</div>' : '';

    const booksHTML = await Promise.all(books.map(async book => {
        const isOwnedByUser = isHeldBooks || heldBooks.some(heldBook => heldBook.id === book.id);

        var bookHolder, holders;
        if (!isOwnedByUser && book.isTaken) {
            bookHolder = await fetchBookById(book.id);
            holders = bookHolder.holders;
        }
        return `
            <div class="book-card">
                <div class="book-content">
                    ${book.series ? `
                        <div class="book-series">
                            <strong>${escapeHtml(book.series)}</strong>
                            ${book.series_index ? ` (כרך ${book.series_index})` : ''}
                        </div>
                        <div class="book-title">${escapeHtml(book.book_name)}</div>
                    ` : `
                    <div class="book-series">${escapeHtml(book.book_name)}</div>
                    `}

                    ${book.author ? `<div class="book-author">מאת ${escapeHtml(book.author)}</div>` : ''}

                    <div class="book-details">
                        <div class="book-detail">
                            <span class="label">קטגוריה:</span>
                            <span class="value">${escapeHtml(book.category)}</span>
                        </div>
                        ${book.sub_category ? `
                            <div class="book-detail">
                                <span class="label">תת-קטגוריה:</span>
                                <span class="value">${escapeHtml(book.sub_category)}</span>
                            </div>
                        ` : ''}
                        ${book.label ? `
                            <div class="book-detail">
                                <span class="label">תווית:</span>
                                <span class="value">${escapeHtml(book.label)}</span>
                            </div>
                        ` : ''}
                        <div class="book-detail">
                            <span class="label">זמין:</span>
                            <span class="availability ${book.isTaken ? 'unavailable' : 'available'}">
                                ${book.isTaken ? 'לא זמין' : `${book.quantity} עותקים`}
                            </span>
                        </div>
                    </div>

                    ${book.description ? `
                        <div class="book-description">
                            <strong>תיאור:</strong>
                            <p>${escapeHtml(book.description)}</p>
                        </div>
                    ` : ''}

                    ${book.notes ? `
                        <div class="book-notes">
                            <strong>הערות:</strong>
                            <p>${escapeHtml(book.notes)}</p>
                        </div>
                    ` : ''}

                    ${book.librarian_notes && currentUser.permission === 9 ? `
                        <div class="book-librarian-notes">
                            <strong>הערות ספרן:</strong>
                            <p>${escapeHtml(book.librarian_notes)}</p>
                        </div>
                    ` : ''}

                    ${holders ? `
                        <div class="book-holder">
                            <strong>נמצא אצל</strong>
                            <p>${escapeHtml(holders.map(h => h.display_name).join(', '))}</p>
                        </div>
                    ` : ''}
                </div>

                <div class="book-button-container">
                    ${isOwnedByUser ? `
                        <button
                            class="return-btn"
                            onclick="returnBook(${book.id})"
                        >
                            החזר ספר
                        </button>
                    ` : `
                        <button
                            class="obtain-btn"
                            onclick="obtainBook(${book.id})"
                            ${book.isTaken ? 'disabled' : ''}
                        >
                            ${book.isTaken ? 'לא זמין' : 'קבל ספר'}
                        </button>
                    `}
                </div>
            </div>
            `;
    }));

    booksContainer.innerHTML = titleHtml + `<div class="books-grid">${booksHTML.join('')}</div>`;

    requestAnimationFrame(() => {
        document.querySelectorAll('.book-card').forEach((card, i) => {
            setTimeout(() => {
                card.classList.add('visible');
            }, i * motionStaggerDelay_ms); // optional stagger effect
        });
    });
}

async function fetchBookById(bookId){
    try {
        const response = await fetch(`http://${window.CONFIG.SERVER_URL}/book/id/${bookId}`);
        const data = await response.json();

        if (response.ok){
            return data.book;
        } else {
            showMessage(data.message || 'נכשל במציאת ספר', 'error');
        }
    } catch (error) {
        console.error('fetch book by id:', error);
        showMessage('שגיאה בהתחברות לשרת', 'error');
    }
}

// Replace the obtainBook function with this updated version
async function obtainBook(bookId) {
    if (!currentUser || !currentUser.id) {
        showMessage('אנא התחברו כדי לקבל ספרים', 'error');
        return;
    }

    // Find the book card and button
    const bookCard = document.querySelector(`button[onclick="obtainBook(${bookId})"]`).closest('.book-card');
    const obtainBtn = bookCard.querySelector('.obtain-btn');

    // Show loading state on the button
    const originalText = obtainBtn.textContent;
    obtainBtn.disabled = true;
    obtainBtn.textContent = 'מקבל...';
    obtainBtn.style.backgroundColor = '#9ca3af';

    try {
        const response = await fetch(`http://${window.CONFIG.SERVER_URL}/library/user/id/${currentUser.id}/obtain`, {
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
            showMessage(`הספר "${data.book.book_name}" נתקבל בהצלחה!`, 'success');

            // Update held books data
            await loadHeldBooks();

            // Update the availability display in the card
            const availabilitySpan = bookCard.querySelector('.availability');

            // Find the book in allBooks to get current availability info
            const bookIndex = allBooks.findIndex(book => book.id === bookId);
            let shouldDisableButton = false;

            if (bookIndex !== -1) {
                const book = allBooks[bookIndex];
                // Reduce available quantity by 1
                const newAvailableCount = book.quantity - (book.taken_count || 0) - 1;

                if (newAvailableCount <= 0) {
                    // No more copies available
                    availabilitySpan.textContent = 'לא זמין';
                    availabilitySpan.className = 'availability unavailable';
                    allBooks[bookIndex].isTaken = true;
                    shouldDisableButton = true;
                } else {
                    // Still copies available
                    availabilitySpan.textContent = `${newAvailableCount} עותקים`;
                    availabilitySpan.className = 'availability available';
                    // Update taken count
                    allBooks[bookIndex].taken_count = (book.taken_count || 0) + 1;
                }
            } else {
                // Fallback if book not found in array
                availabilitySpan.textContent = 'לא זמין';
                availabilitySpan.className = 'availability unavailable';
                shouldDisableButton = true;
            }

            // Always replace with return button since THIS USER just obtained the book
            obtainBtn.outerHTML = `
                <button
                    class="return-btn"
                    onclick="returnBook(${bookId})"
                >
                    החזר ספר
                </button>
                `;

        } else {
            // Restore button on error
            obtainBtn.disabled = false;
            obtainBtn.textContent = originalText;
            obtainBtn.style.backgroundColor = '#10b981';
            showMessage(data.message || 'נכשל בקבלת הספר', 'error');
        }
    } catch (error) {
        console.error('Obtain book error:', error);
        // Restore button on error
        obtainBtn.disabled = false;
        obtainBtn.textContent = originalText;
        obtainBtn.style.backgroundColor = '#10b981';
        showMessage('שגיאה בהתחברות לשרת', 'error');
    }
}

// Replace the returnBook function with this updated version
async function returnBook(bookId) {
    if (!currentUser || !currentUser.id) {
        showMessage('אנא התחברו כדי להחזיר ספרים', 'error');
        return;
    }

    // Find the book card and button
    const bookCard = document.querySelector(`button[onclick="returnBook(${bookId})"]`).closest('.book-card');
    const returnBtn = bookCard.querySelector('.return-btn');

    // Show loading state on the button
    const originalText = returnBtn.textContent;
    returnBtn.disabled = true;
    returnBtn.textContent = 'מחזיר...';
    returnBtn.style.backgroundColor = '#9ca3af';

    try {
        const response = await fetch(`http://${window.CONFIG.SERVER_URL}/library/user/id/${currentUser.id}/return`, {
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
            showMessage(`הספר "${data.book.book_name}" הוחזר בהצלחה!`, 'success');

            // Update held books data
            await loadHeldBooks();

            if (showingHeldBooks) {
                // If we're showing held books, remove this card entirely
                bookCard.style.opacity = '0';
                bookCard.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    bookCard.remove();
                    // Check if there are any books left
                    const remainingCards = document.querySelectorAll('.book-card');
                    if (remainingCards.length === 0) {
                        document.getElementById('books-container').innerHTML = '<div class="no-results">אין ספרים בבעלותכם כרגע</div>';
                    }
                }, 300);
            } else {
                // Update the availability display in the card
                const availabilitySpan = bookCard.querySelector('.availability');

                // Find the book in allBooks to get current availability info
                const bookIndex = allBooks.findIndex(book => book.id === bookId);

                if (bookIndex !== -1) {
                    const book = allBooks[bookIndex];
                    // Increase available quantity by 1 (return a copy)
                    const newAvailableCount = book.quantity - Math.max((book.taken_count || 1) - 1, 0);

                    availabilitySpan.textContent = `${newAvailableCount} עותקים`;
                    availabilitySpan.className = 'availability available';

                    // Update taken count
                    allBooks[bookIndex].taken_count = Math.max((book.taken_count || 1) - 1, 0);
                    allBooks[bookIndex].isTaken = allBooks[bookIndex].taken_count >= book.quantity;
                } else {
                    // Fallback if book not found in array
                    availabilitySpan.textContent = '1 עותק';
                    availabilitySpan.className = 'availability available';
                }

                // Replace the return button with obtain button
                returnBtn.outerHTML = `
                    <button
                        class="obtain-btn"
                        onclick="obtainBook(${bookId})"
                    >
                        קבל ספר
                    </button>
                    `;
            }

        } else {
            // Restore button on error
            returnBtn.disabled = false;
            returnBtn.textContent = originalText;
            returnBtn.style.backgroundColor = '#f59e0b';
            showMessage(data.message || 'נכשל בהחזרת הספר', 'error');
        }
    } catch (error) {
        console.error('Return book error:', error);
        // Restore button on error
        returnBtn.disabled = false;
        returnBtn.textContent = originalText;
        returnBtn.style.backgroundColor = '#f59e0b';
        showMessage('שגיאה בהתחברות לשרת', 'error');
    }
}

async function loadHeldBooks() {
    if (!currentUser || !currentUser.id) {
        return;
    }

    try {
        const response = await fetch(`http://${window.CONFIG.SERVER_URL}/user/id/${currentUser.id}/holding`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            heldBooks = data.books || [];
        } else {
            console.error('Failed to load held books:', data.message);
            heldBooks = [];
        }
    } catch (error) {
        console.error('Error loading held books:', error);
        heldBooks = [];
    }
}

async function loadAllBooks(){
    try {
        const response = await fetch(`http://${window.CONFIG.SERVER_URL}/book/all`, {
            method: 'GET',
        });
        const data = await response.json();

        if (response.ok) {
            allBooks = data.books || [];
            totalBooksCount = allBooks.length
        } else {
            console.error('Failed to load all books:', data.message);
            heldBooks = [];
        }
    } catch (error) {
        console.error('Error loading held books:', error);
        heldBooks = [];
    }
}

function showMessage(text, type) {
    const messageContainer = document.getElementById('message-container');
    messageContainer.innerHTML = `<div class="message ${type}">${escapeHtml(text)}</div>`;

    // Auto-hide success and info messages after 5 seconds
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
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

function admin_dashboard(){
    window.location.href = '/admin';
}

function toggleHeldBooks() {
    showingHeldBooks = !showingHeldBooks;
    const heldBooksBtn = document.querySelector('.held-books-btn');

    if (showingHeldBooks) {
        displayBooks(heldBooks, true);
        heldBooksBtn.textContent = 'חזור לחיפוש';
        showMessage(`יש לכם ${heldBooks.length} ספרים`, 'info');
    } else {
        document.getElementById('books-container').innerHTML = '';
        heldBooksBtn.textContent = 'הספרים שלי';
        document.getElementById('message-container').innerHTML = '';
        showAllBooks();
    }
}

function updateStats() {
    const totalUsers = allUsers.length;
    const totalBooksBorrowed = allUsers.reduce((sum, user) => sum + (user.held_books ? user.held_books.length : 0), 0);

    document.getElementById('total-users').textContent = totalUsers;
    document.getElementById('total-books').textContent = totalBooksCount;
    document.getElementById('total-books-borrowed').textContent = totalBooksBorrowed;
}

async function loadAllUsers() {
    try {
        const response = await fetch(`http://${window.CONFIG.SERVER_URL}/user/all`);
        const data = await response.json();

        if (response.ok) allUsers = data
    } catch (error) {
        console.error('Load users error:', error);
    }
}

async function loadBooksCount() {
    try {
        const response = await fetch(`http://${window.CONFIG.SERVER_URL}/book/all`);
        const data = await response.json();

        if (response.ok) totalBooksCount = data.books.length || 0;
        else console.error('Failed to load books count:', data.message);
    } catch (error) {
        console.error('Load books count error:', error);
    }
}

async function loadSystemMessage() {
    const messageDisplay = document.getElementById('messageDisplay');
    const container = document.getElementById('systemMessageContainer');

    try {
        const response = await fetch(`http://${window.CONFIG.SERVER_URL}/system_update`);
        const data = await response.json();

        if (response.ok && data.update && data.update.trim()) {
            // Show the container and display the message
            container.style.opacity = 1;

            messageDisplay.innerHTML = `<p>${escapeHtml(data.update)}</p>`;
        } else {
            // No message found - keep container hidden
            container.style.display = 'none';
        }
    } catch (error) {
        console.error('Load system message error:', error);
        // Show error but keep container visible
        container.classList.add('show');
        messageDisplay.innerHTML = `
                    <div class="error-message">
                        שגיאה בטעינת הודעת המערכת
                    </div>
                `;
    }
}