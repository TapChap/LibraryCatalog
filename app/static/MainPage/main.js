import {LibraryState} from './LibraryState.js';
import {ApiClient} from '../ApiClient.js';
import {PaginationState} from "./PaginationState.js";

// =============================================================================
// LIBRARY MANAGEMENT SYSTEM
// =============================================================================

// Initialize global state
const state = new LibraryState();
const paginationState = new PaginationState();

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

function setupAdminButton() {
	const adminBtn = document.getElementById("admin");
	adminBtn.onclick = admin_dashboard
	adminBtn.hidden = !state.isUserModerator();
}

function setupLogoutButton() {
	const logoutBtn = document.getElementById("logout");
	logoutBtn.onclick = logout
}

async function loadInitialData() {
	await Promise.all([
		loadAllBooks(),
		loadAllUsers(),
		loadHeldBooks(),
		loadSystemMessage()
	]);
	displayBooks(state.allBooks);
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

function closeSystemMessage() {
	const messageContainer = document.getElementById("systemMessageContainer")
	messageContainer.style.display = "none";
}

// =============================================================================
// SEARCH FUNCTIONALITY
// =============================================================================

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
		if (books !== 404) await displayBooks(books, false, true, false);
		
		const message = books === 404
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

// =============================================================================
// BOOK DISPLAY FUNCTIONS
// =============================================================================


// =============================================================================
// OPTIMIZED BOOK DISPLAY FUNCTIONS
// =============================================================================

async function displayBooks(books, isHeldBooks = false, animate = true, groupByCategory = true) {
	const booksContainer = document.getElementById('books-container');
	
	// Clear existing scroll listener
	window.removeEventListener('scroll', handleScroll);
	
	if (books.length === 0) {
		displayEmptyState(booksContainer, isHeldBooks);
		return;
	}
	
	// Set up pagination state
	paginationState.setBooks(books, isHeldBooks, groupByCategory);
	
	// Clear container and add title
	const titleHtml = isHeldBooks ? '<div class="section-title">הספרים שלכם</div>' : '';
	booksContainer.innerHTML = titleHtml;
	
	// Create books grid container
	const booksGrid = document.createElement('div');
	booksGrid.className = 'books-grid';
	booksContainer.appendChild(booksGrid);
	
	// Add loading indicator
	const loadingIndicator = createLoadingIndicator();
	booksContainer.appendChild(loadingIndicator);
	
	// Load first batch
	await loadNextBatch(animate);
	
	// Set up scroll listener for infinite scroll
	window.addEventListener('scroll', handleScroll);
}

function createLoadingIndicator() {
	const loadingDiv = document.createElement('div');
	loadingDiv.id = 'loading-indicator';
	loadingDiv.className = 'loading-indicator';
	loadingDiv.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">טוען ספרים נוספים...</div>
    `;
	loadingDiv.style.display = 'none';
	return loadingDiv;
}

async function loadNextBatch(animate = true) {
	if (paginationState.isLoading || !paginationState.hasMore) return;
	
	paginationState.isLoading = true;
	const loadingIndicator = document.getElementById('loading-indicator');
	
	// Show loading indicator
	if (paginationState.currentPage > 0) {
		loadingIndicator.style.display = 'block';
	}
	
	try {
		const batch = paginationState.getNextBatch();
		
		if (batch.length > 0) {
			await renderBookBatch(batch, animate);
		}
		
		// Hide loading indicator
		if (!paginationState.hasMore) {
			loadingIndicator.style.display = 'none';
		}
	} finally {
		paginationState.isLoading = false;
		if (paginationState.hasMore) {
			loadingIndicator.style.display = 'none';
		}
	}
}

async function renderBookBatch(books, animate = true) {
	const booksGrid = document.querySelector('.books-grid');
	if (!booksGrid) return;
	
	// Generate HTML for batch
	const batchHtml = await generateBatchHtml(books);
	
	// Create temporary container to parse HTML
	const tempContainer = document.createElement('div');
	tempContainer.innerHTML = batchHtml;
	
	// Add cards to grid
	const cards = tempContainer.querySelectorAll('.book-card');
	cards.forEach(card => {
		if (animate) {
			card.style.opacity = '0';
			card.style.transform = 'translateY(20px)';
		}
		booksGrid.appendChild(card);
	});
	
	// Animate cards if needed
	if (animate) {
		await animateNewCards(cards);
	}
}

async function generateBatchHtml(books) {
	const cardsHtml = await Promise.all(
		books.map(book => generateBookCardHTML(book, paginationState.isHeldBooksView))
	);
	return cardsHtml.join('');
}

async function animateNewCards(cards) {
	const animationDelay = Math.min(
		PAGINATION_CONFIG.ANIMATION_DELAY,
		PAGINATION_CONFIG.MAX_ANIMATION_TIME / cards.length
	);
	
	return new Promise(resolve => {
		cards.forEach((card, index) => {
			setTimeout(() => {
				card.style.transition = 'all 0.3s ease';
				card.style.opacity = '1';
				card.style.transform = 'translateY(0)';
				
				if (index === cards.length - 1) {
					setTimeout(resolve, 300);
				}
			}, index * animationDelay);
		});
	});
}

// =============================================================================
// SCROLL HANDLING
// =============================================================================

function handleScroll() {
	if (paginationState.isLoading || !paginationState.hasMore) return;
	
	const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
	const windowHeight = window.innerHeight;
	const documentHeight = document.documentElement.scrollHeight;
	
	const scrolledToBottom = scrollTop + windowHeight >= documentHeight - PAGINATION_CONFIG.SCROLL_THRESHOLD;
	
	if (scrolledToBottom) {
		loadNextBatch(true);
	}
}

// =============================================================================
// SEARCH OPTIMIZATION
// =============================================================================

// Debounced search function
function createDebouncedSearch(delay = 300) {
	let timeoutId;
	return function(searchTerm) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			performSearch(searchTerm);
		}, delay);
	};
}

const debouncedSearch = createDebouncedSearch();

function handleKeyPress(event) {
	if (event.key === 'Enter') {
		searchBooks();
	} else {
		// Optional: implement real-time search
		// debouncedSearch(event.target.value);
	}
}

async function performSearch(searchTerm) {
	if (!searchTerm.trim()) {
		displayBooks(state.allBooks, false, false, true);
		return;
	}
	
	try {
		const books = await ApiClient.searchBooks(searchTerm);
		if (books !== 404) {
			await displayBooks(books, false, true, false);
		}
	} catch (error) {
		console.error('Search error:', error);
	}
}

// =============================================================================
// IMPROVED BOOK ACTIONS
// =============================================================================

async function refreshCurrentView() {
	const currentBooks = paginationState.isHeldBooksView ? state.heldBooks : state.allBooks;
	const groupByCategory = !paginationState.isHeldBooksView;
	
	await displayBooks(currentBooks, paginationState.isHeldBooksView, false, groupByCategory);
}

function updateBookCardAfterReturn(bookId, button) {
	const bookCard = button.closest('.book-card');
	
	if (paginationState.isHeldBooksView) {
		// Remove from displayed books array
		const index = paginationState.displayedBooks.findIndex(book => book.id === bookId);
		if (index !== -1) {
			paginationState.displayedBooks.splice(index, 1);
		}
		
		// Remove from allBooksToShow array
		const allIndex = paginationState.allBooksToShow.findIndex(book => book.id === bookId);
		if (allIndex !== -1) {
			paginationState.allBooksToShow.splice(allIndex, 1);
		}
		
		removeBookCardWithAnimation(bookCard);
	} else {
		updateBookAvailability(bookCard, bookId);
		replaceButtonWithObtain(button, bookId);
	}
}

// =============================================================================
// PERFORMANCE OPTIMIZATIONS
// =============================================================================

// Use requestAnimationFrame for smooth animations
function requestAnimationFrame(callback) {
	return window.requestAnimationFrame(callback);
}

// Optimize DOM queries by caching elements
const domCache = {
	booksContainer: null,
	searchInput: null,
	messageContainer: null,
	
	get(id) {
		if (!this[id]) {
			this[id] = document.getElementById(id);
		}
		return this[id];
	}
};

// =============================================================================
// MEMORY MANAGEMENT
// =============================================================================

function clearPaginationState() {
	paginationState.reset();
	window.removeEventListener('scroll', handleScroll);
}

// Call this when navigating away or resetting
function cleanup() {
	clearPaginationState();
	// Clear any timeouts
	if (window.searchTimeout) {
		clearTimeout(window.searchTimeout);
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
		const subCategoryKeys = Object.keys(subCategories).sort();
		
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

async function animateBookCards(amount) {
	const lowerLimit = 0.75 * 1000, upper_limit = 5 * 1000
	const clamp = val => Math.min(upper_limit, Math.max(lowerLimit, val))
	
	const tAnimationTime = amount * 45;
	const motionStaggerDelay = clamp(tAnimationTime) / amount;
	
	document.querySelectorAll('.book-card').forEach((card, index) => {
		setTimeout(() => {
			card.classList.add('visible');
		}, index * motionStaggerDelay);
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
	if (!isOwnedByUser && book.is_taken) {
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

function generateBookDetailsHtml(book) {
	return `
        <div class="book-details">
        ${book.author ? `
			<div class="book-author">מאת ${escapeHtml(book.author)}</div>` : ''}
        
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
            
            ${book.location ? `
                <div class="book-detail">
                    <span class="label">מיקום:</span>
                    <span class="location ${book.location}">${escapeHtml(book.location)}</span>
                </div>
            ` : ''}
            
            <div class="book-detail">
                <span class="label">זמין:</span>
                <span class="availability ${book.is_taken ? 'unavailable' : 'available'}">
                    ${book.is_taken ? 'לא זמין' : `${book.quantity} עותקים`}
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
	return (book.librarian_notes && state.isUserModerator()) ? `
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
	if (state.isUserModerator()) {
		return generateAdminButtonsHtml(book, isOwnedByUser);
	} else {
		return generateUserButtonsHtml(book, isOwnedByUser);
	}
}

function generateAdminButtonsHtml(book, isOwnedByUser) {
	return `
        <div class="admin-button-container">
            <button class="edit-btn" onclick="editBook(${book.id})">
                ערוך
            </button>
            ${isOwnedByUser ? `
                <button class="return-btn" onclick="returnBook(${book.id})">
                    החזר
                </button>
            ` : `
                <button class="obtain-btn" onclick="obtainBook(${book.id})" ${book.is_taken ? 'disabled' : ''}>
                    ${book.is_taken ? 'לא זמין' : 'קבל'}
                </button>
            `}
            <button class="delete-btn" onclick="deleteBook(${book.id})">
                מחק
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
        <button class="obtain-btn" onclick="obtainBook(${book.id})" ${book.is_taken ? 'disabled' : ''}>
            ${book.is_taken ? 'לא זמין' : 'קבל ספר'}
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
		
		const obtainedBook = state.getBookById(bookId);
		obtainedBook.quantity = obtainedBook.quantity - 1;
		state.heldBooks.push(obtainedBook);
		
		// await refreshBookData();
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
		restoreButtonState(button, 'החזר', '#f59e0b');
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
	bookCard.style.transform = 'scale(0.01) rotate(180deg)';
	
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

// =============================================================================
// UI HELPER FUNCTIONS
// =============================================================================

function showMessage(text, type) {
	// if (type !== "info") return;
	
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

async function sleep(ms) {
	const start = performance.now();
	while (performance.now() - start < ms) {
		continue;
	}
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
		displayBooks(state.allBooks, false, false, true);
	}
}

// =============================================================================
// PLACEHOLDER FUNCTIONS (TO BE IMPLEMENTED)
// =============================================================================

async function editBook(bookId) {
	// TODO: Implement edit book functionality
	console.log('Edit book:', bookId);
}

// =============================================================================
// export function to be accessible from the html file
// =============================================================================

window.searchBooks = searchBooks;
window.closeSystemMessage = closeSystemMessage;
window.toggleHeldBooks = toggleHeldBooks;
window.obtainBook = obtainBook;
window.returnBook = returnBook;
window.deleteBook = deleteBook;
window.editBook = editBook;
window.handleKeyPress = handleKeyPress;
window.admin_dashboard = admin_dashboard;
window.logout = logout;
window.displayBooks = displayBooks;
window.handleScroll = handleScroll;
window.loadNextBatch = loadNextBatch;
window.refreshCurrentView = refreshCurrentView;
window.cleanup = cleanup;