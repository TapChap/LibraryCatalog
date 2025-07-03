import { LibraryState } from './LibraryState.js';
import { ApiClient } from './ApiClient.js';

// =============================================================================
// LIBRARY MANAGEMENT SYSTEM
// =============================================================================

// Initialize global state
const state = new LibraryState();

// =============================================================================
// INITIALIZATION & SETUP
// =============================================================================

document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
	try {
		setupUser();
		await loadInitialData();
		setupEventListeners();
		updateStats();
	} catch (error) {
		console.error('App initialization error:', error);
		showMessage('שגיאה באתחול האפליקציה', 'error');
	}
}

function setupUser() {
	const userData = sessionStorage.getItem('libraryUser');
	if (userData) {
		const user = JSON.parse(userData);
		state.setCurrentUser(user);
		displayWelcomeMessage(user);
		setupAdminButton(user);
		setupLogoutButton();
	}
}

function displayWelcomeMessage(user) {
	const displayName = user.display_name || user.username;
	document.getElementById('user-display').textContent = `ברוכים הבאים, ${displayName}!`;
}

function setupAdminButton(user) {
	const adminBtn = document.getElementById("admin");
	adminBtn.onclick=admin_dashboard
	adminBtn.hidden = user.permission !== 9;
}

function setupLogoutButton() {
	const logoutBtn = document.getElementById("logout");
	logoutBtn.onclick=logout
}

async function loadInitialData() {
	await Promise.all([
		loadAllBooks(),
		loadAllUsers(),
		loadHeldBooks(),
		loadSystemMessage()
	]);
	showAllBooks();
}

function setupEventListeners() {
	const searchInput = document.getElementById('search-input');
	if (searchInput) {
		searchInput.addEventListener('keypress', handleKeyPress);
	}
}

// =============================================================================
// DATA LOADING FUNCTIONS
// =============================================================================

async function loadAllBooks() {
	try {
		const books = await ApiClient.getAllBooks();
		state.setAllBooks(books);
	} catch (error) {
		console.error('Error loading books:', error);
		showMessage('שגיאה בטעינת הספרים', 'error');
	}
}

async function loadAllUsers() {
	try {
		const users = await ApiClient.getAllUsers();
		state.setAllUsers(users);
	} catch (error) {
		console.error('Error loading users:', error);
	}
}

async function loadHeldBooks() {
	if (!state.currentUser?.id) return;
	
	try {
		const books = await ApiClient.getUserHeldBooks(state.currentUser.id);
		state.setHeldBooks(books);
	} catch (error) {
		console.error('Error loading held books:', error);
		state.setHeldBooks([]);
	}
}

async function loadSystemMessage() {
	const messageDisplay = document.getElementById('messageDisplay');
	const container = document.getElementById('systemMessageContainer');
	
	if (!messageDisplay || !container) return;
	
	try {
		const message = await ApiClient.getSystemMessage();
		
		if (message && message.trim()) {
			container.style.opacity = 1;
			messageDisplay.innerHTML = `<p>${escapeHtml(message)}</p>`;
		} else {
			container.style.display = 'none';
		}
	} catch (error) {
		console.error('Load system message error:', error);
		container.classList.add('show');
		messageDisplay.innerHTML = `
            <div class="error-message">
                שגיאה בטעינת הודעת המערכת
            </div>
        `;
	}
}

// =============================================================================
// SEARCH FUNCTIONALITY
// =============================================================================

function handleKeyPress(event) {
	if (event.key === 'Enter') {
		searchBooks();
	}
}

async function searchBooks() {
	const searchInput = document.getElementById('search-input');
	const bookName = searchInput.value.trim();
	
	if (!bookName) {
		showMessage('אנא הכניסו שם ספר לחיפוש', 'error');
		return;
	}
	
	const searchBtn = document.getElementById('search-btn');
	setSearchLoadingState(searchBtn, true);
	
	try {
		const books = await ApiClient.searchBooks(bookName);
		await displayBooks(books, false, true, false);
		
		const message = books.length === 0
			? 'לא נמצאו ספרים עם השם הזה'
			: `נמצאו ${books.length} ספר/ים`;
		const messageType = books.length === 0 ? 'info' : 'success';
		
		showMessage(message, messageType);
	} catch (error) {
		console.error('Search error:', error);
		showMessage('שגיאה בחיפוש ספרים', 'error');
		clearBooksContainer();
	} finally {
		setSearchLoadingState(searchBtn, false);
	}
}

function setSearchLoadingState(button, isLoading) {
	if (isLoading) {
		button.disabled = true;
		button.textContent = 'מחפש...';
	} else {
		button.disabled = false;
		button.textContent = 'חפש ספרים';
	}
}

function showAllBooks() {
	displayBooks(state.allBooks);
}

// =============================================================================
// BOOK DISPLAY FUNCTIONS
// =============================================================================

async function displayBooks(books, isHeldBooks = false, animate = true, groupByCategory = true) {
	const booksContainer = document.getElementById('books-container');
	
	if (books.length === 0) {
		displayEmptyState(booksContainer, isHeldBooks);
		return;
	}
	
	const titleHtml = isHeldBooks ? '<div class="section-title">הספרים שלכם</div>' : '';
	const contentHtml = await generateBooksHtml(books, isHeldBooks, groupByCategory);
	
	booksContainer.innerHTML = titleHtml + contentHtml;
	
	if (animate) {
		animateBookCards();
	} else {
		showAllBookCards();
	}
}

function displayEmptyState(container, isHeldBooks) {
	const message = isHeldBooks
		? 'אין ספרים בבעלותכם כרגע'
		: 'לא נמצאו ספרים. נסו מונח חיפוש אחר.';
	container.innerHTML = `<div class="no-results">${message}</div>`;
}

async function generateBooksHtml(books, isHeldBooks, groupByCategory) {
	if (groupByCategory && !isHeldBooks) {
		return await generateGroupedBooksHtml(books);
	} else {
		return await generateUngroupedBooksHtml(books, isHeldBooks);
	}
}

async function generateGroupedBooksHtml(books) {
	const groupedBooks = groupBooksByCategory(books);
	const categories = Object.keys(groupedBooks);
	let html = '';
	
	for (const category of categories) {
		html += `<div class="category-header">${escapeHtml(category)}</div>`;
		
		const subCategories = groupedBooks[category];
		const subCategoryKeys = Object.keys(subCategories);
		
		for (const subCategory of subCategoryKeys) {
			if (subCategoryKeys.length > 1 || subCategory !== 'כללי') {
				html += `<div class="subcategory-header">${escapeHtml(subCategory)}</div>`;
			}
			
			const categoryBooks = subCategories[subCategory];
			const booksHtml = await generateBookCardsHtml(categoryBooks, false);
			html += `<div class="books-grid">${booksHtml}</div>`;
		}
	}
	
	return html;
}

async function generateUngroupedBooksHtml(books, isHeldBooks) {
	const booksHtml = await generateBookCardsHtml(books, isHeldBooks);
	return `<div class="books-grid">${booksHtml}</div>`;
}

async function generateBookCardsHtml(books, isHeldBooks) {
	const cardsHtml = await Promise.all(
		books.map(book => generateBookCardHTML(book, isHeldBooks))
	);
	return cardsHtml.join('');
}

function groupBooksByCategory(books) {
	const grouped = {};
	
	books.forEach(book => {
		const category = book.category || 'ללא קטגוריה';
		const subCategory = book.sub_category || 'כללי';
		
		if (!grouped[category]) {
			grouped[category] = {};
		}
		
		if (!grouped[category][subCategory]) {
			grouped[category][subCategory] = [];
		}
		
		grouped[category][subCategory].push(book);
	});
	
	return grouped;
}

function animateBookCards() {
	const motionStaggerDelay = 75;
	
	requestAnimationFrame(() => {
		document.querySelectorAll('.book-card').forEach((card, index) => {
			setTimeout(() => {
				card.classList.add('visible');
			}, index * motionStaggerDelay);
		});
	});
}

function showAllBookCards() {
	document.querySelectorAll('.book-card').forEach(card => {
		card.classList.add('visible');
	});
}

// =============================================================================
// BOOK CARD GENERATION
// =============================================================================

async function generateBookCardHTML(book, isHeldBooks) {
	const isOwnedByUser = isHeldBooks || state.heldBooks.some(heldBook => heldBook.id === book.id);
	const holders = await getBookHolders(book, isOwnedByUser);
	
	return `
        <div class="book-card">
            <div class="book-content">
                ${generateBookTitleHtml(book)}
                ${generateBookAuthorHtml(book)}
                ${generateBookDetailsHtml(book)}
                ${generateBookDescriptionHtml(book)}
                ${generateBookNotesHtml(book)}
                ${generateLibrarianNotesHtml(book)}
                ${generateBookHoldersHtml(holders)}
            </div>
            <div class="book-button-container">
                ${generateBookButtonsHtml(book, isOwnedByUser)}
            </div>
        </div>
    `;
}

async function getBookHolders(book, isOwnedByUser) {
	if (!isOwnedByUser && book.isTaken) {
		try {
			const bookDetails = await ApiClient.getBookById(book.id);
			return bookDetails.holders;
		} catch (error) {
			console.error('Error fetching book holders:', error);
		}
	}
	return null;
}

function generateBookTitleHtml(book) {
	if (book.series) {
		return `
            <div class="book-series">
                <strong>${escapeHtml(book.series)}</strong>
                ${book.series_index ? ` (כרך ${book.series_index})` : ''}
            </div>
            <div class="book-title">${escapeHtml(book.book_name)}</div>
        `;
	} else {
		return `<div class="book-series">${escapeHtml(book.book_name)}</div>`;
	}
}

function generateBookAuthorHtml(book) {
	return book.author ? `<div class="book-author">מאת ${escapeHtml(book.author)}</div>` : '';
}

function generateBookDetailsHtml(book) {
	return `
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
    `;
}

function generateBookDescriptionHtml(book) {
	return book.description ? `
        <div class="book-description">
            <strong>תיאור:</strong>
            <p>${escapeHtml(book.description)}</p>
        </div>
    ` : '';
}

function generateBookNotesHtml(book) {
	return book.notes ? `
        <div class="book-notes">
            <strong>הערות:</strong>
            <p>${escapeHtml(book.notes)}</p>
        </div>
    ` : '';
}

function generateLibrarianNotesHtml(book) {
	return (book.librarian_notes && state.isUserAdmin()) ? `
        <div class="book-librarian-notes">
            <strong>הערות ספרן:</strong>
            <p>${escapeHtml(book.librarian_notes)}</p>
        </div>
    ` : '';
}

function generateBookHoldersHtml(holders) {
	return holders ? `
        <div class="book-holder">
            <strong>נמצא אצל</strong>
            <p>${escapeHtml(holders.map(h => h.display_name).join(', '))}</p>
        </div>
    ` : '';
}

function generateBookButtonsHtml(book, isOwnedByUser) {
	if (state.isUserAdmin()) {
		return generateAdminButtonsHtml(book, isOwnedByUser);
	} else {
		return generateUserButtonsHtml(book, isOwnedByUser);
	}
}

function generateAdminButtonsHtml(book, isOwnedByUser) {
	return `
        <div class="admin-button-container">
            <button class="edit-btn" onclick="editBook(${book.id})">
                ערוך ספר
            </button>
            ${isOwnedByUser ? `
                <button class="return-btn" onclick="returnBook(${book.id})">
                    החזר ספר
                </button>
            ` : `
                <button class="obtain-btn" onclick="obtainBook(${book.id})" ${book.isTaken ? 'disabled' : ''}>
                    ${book.isTaken ? 'לא זמין' : 'קבל ספר'}
                </button>
            `}
            <button class="delete-btn" onclick="deleteBook(${book.id})">
                מחק ספר
            </button>
        </div>
    `;
}

function generateUserButtonsHtml(book, isOwnedByUser) {
	return isOwnedByUser ? `
        <button class="return-btn" onclick="returnBook(${book.id})">
            החזר ספר
        </button>
    ` : `
        <button class="obtain-btn" onclick="obtainBook(${book.id})" ${book.isTaken ? 'disabled' : ''}>
            ${book.isTaken ? 'לא זמין' : 'קבל ספר'}
        </button>
    `;
}

// =============================================================================
// BOOK ACTIONS
// =============================================================================

async function obtainBook(bookId) {
	if (!validateUserLoggedIn()) return;
	
	const button = findBookActionButton(bookId, 'obtainBook');
	if (!button) return;
	
	setButtonLoadingState(button, 'מקבל...', '#9ca3af');
	
	try {
		await ApiClient.obtainBook(state.currentUser.id, bookId);
		await refreshBookData();
		updateBookCardAfterObtain(bookId, button);
	} catch (error) {
		console.error('Obtain book error:', error);
		showMessage(error.message || 'שגיאה בהתחברות לשרת', 'error');
		restoreButtonState(button, 'קבל ספר', '#10b981');
	}
}

async function returnBook(bookId) {
	if (!validateUserLoggedIn()) return;
	
	const button = findBookActionButton(bookId, 'returnBook');
	if (!button) return;
	
	setButtonLoadingState(button, 'מחזיר...', '#9ca3af');
	
	try {
		const result = await ApiClient.returnBook(state.currentUser.id, bookId);
		showMessage(`הספר "${result.book.book_name}" הוחזר בהצלחה!`, 'success');
		
		await refreshBookData();
		updateBookCardAfterReturn(bookId, button);
	} catch (error) {
		console.error('Return book error:', error);
		showMessage(error.message || 'שגיאה בהתחברות לשרת', 'error');
		restoreButtonState(button, 'החזר ספר', '#f59e0b');
	}
}

async function deleteBook(bookId) {
	if (!confirm("האם אתה בטוח שברצונך למחוק את הספר?")) return;
	
	try {
		await ApiClient.deleteBook(bookId);
		await refreshBookData();
		refreshCurrentView();
	} catch (error) {
		console.error("Delete book error:", error);
		showMessage('שגיאה במחיקת הספר', 'error');
	}
}

// =============================================================================
// BOOK ACTION HELPERS
// =============================================================================

function validateUserLoggedIn() {
	if (!state.currentUser?.id) {
		showMessage('אנא התחברו כדי לבצע פעולה זו', 'error');
		return false;
	}
	return true;
}

function findBookActionButton(bookId, action) {
	return document.querySelector(`button[onclick="${action}(${bookId})"]`);
}

function setButtonLoadingState(button, text, color) {
	button.disabled = true;
	button.textContent = text;
	button.style.backgroundColor = color;
}

function restoreButtonState(button, text, color) {
	button.disabled = false;
	button.textContent = text;
	button.style.backgroundColor = color;
}

async function refreshBookData() {
	await Promise.all([
		loadAllBooks(),
		loadHeldBooks()
	]);
}

function updateBookCardAfterObtain(bookId, button) {
	const bookCard = button.closest('.book-card');
	updateBookAvailability(bookCard, bookId);
	replaceButtonWithReturn(button, bookId);
}

function updateBookCardAfterReturn(bookId, button) {
	const bookCard = button.closest('.book-card');
	
	if (state.showingHeldBooks) {
		removeBookCardWithAnimation(bookCard);
	} else {
		updateBookAvailability(bookCard, bookId);
		replaceButtonWithObtain(button, bookId);
	}
}

function updateBookAvailability(bookCard, bookId) {
	const availabilitySpan = bookCard.querySelector('.availability');
	const book = state.allBooks.find(b => b.id === bookId);
	
	if (book) {
		if (book.quantity <= 0) {
			availabilitySpan.textContent = 'לא זמין';
			availabilitySpan.className = 'availability unavailable';
		} else {
			availabilitySpan.textContent = `${book.quantity} עותקים`;
			availabilitySpan.className = 'availability available';
		}
	}
}

function replaceButtonWithReturn(button, bookId) {
	button.outerHTML = `
        <button class="return-btn" onclick="returnBook(${bookId})">
            החזר ספר
        </button>
    `;
}

function replaceButtonWithObtain(button, bookId) {
	button.outerHTML = `
        <button class="obtain-btn" onclick="obtainBook(${bookId})">
            קבל ספר
        </button>
    `;
}

function removeBookCardWithAnimation(bookCard) {
	bookCard.style.opacity = '0';
	bookCard.style.transform = 'translateY(-20px)';
	
	setTimeout(() => {
		bookCard.remove();
		checkForEmptyBooksList();
	}, 300);
}

function checkForEmptyBooksList() {
	const remainingCards = document.querySelectorAll('.book-card');
	if (remainingCards.length === 0) {
		document.getElementById('books-container').innerHTML =
			'<div class="no-results">אין ספרים בבעלותכם כרגע</div>';
	}
}

function refreshCurrentView() {
	if (state.showingHeldBooks) {
		displayBooks(state.heldBooks, true, false, false);
	} else {
		displayBooks(state.allBooks, false, false, true);
	}
}

// =============================================================================
// UI HELPER FUNCTIONS
// =============================================================================

function showMessage(text, type) {
	const messageContainer = document.getElementById('message-container');
	messageContainer.innerHTML = `<div class="message ${type}">${escapeHtml(text)}</div>`;
	
	if (type === 'success' || type === 'info') {
		setTimeout(() => {
			messageContainer.innerHTML = '';
		}, 5000);
	}
}

function clearBooksContainer() {
	document.getElementById('books-container').innerHTML = '';
}

function escapeHtml(text) {
	if (!text) return '';
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

function updateStats() {
	const totalUsers = state.allUsers.length;
	const totalBooksBorrowed = state.allUsers.reduce((sum, user) => {
		return sum + (user.held_books ? user.held_books.length : 0);
	}, 0);
	
	document.getElementById('total-users').textContent = totalUsers;
	document.getElementById('total-books').textContent = state.totalBooksCount;
	document.getElementById('total-books-borrowed').textContent = totalBooksBorrowed;
}

// =============================================================================
// NAVIGATION FUNCTIONS
// =============================================================================

function logout() {
	sessionStorage.removeItem('libraryUser');
	window.location.href = '/';
}

function admin_dashboard() {
	window.location.href = '/admin';
}

function toggleHeldBooks() {
	const showingHeld = state.toggleHeldBooksView();
	const heldBooksBtn = document.querySelector('.held-books-btn');
	
	if (showingHeld) {
		displayBooks(state.heldBooks, true, true, false);
		heldBooksBtn.textContent = 'חזור לחיפוש';
		showMessage(`יש לכם ${state.heldBooks.length} ספרים`, 'info');
	} else {
		clearBooksContainer();
		heldBooksBtn.textContent = 'הספרים שלי';
		document.getElementById('message-container').innerHTML = '';
		showAllBooks();
	}
}

// =============================================================================
// PLACEHOLDER FUNCTIONS (TO BE IMPLEMENTED)
// =============================================================================

async function editBook(bookId) {
	// TODO: Implement edit book functionality
	console.log('Edit book:', bookId);
}