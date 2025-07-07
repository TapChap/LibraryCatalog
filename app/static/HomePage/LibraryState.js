export class LibraryState {
	constructor() {
		this.currentUser = null;
		this.heldBooks = [];
		this.allBooks = [];
		this.allUsers = [];
		this.totalBooksCount = 0;
		this.showingHeldBooks = false;
		this.showingSearchResults = false;
	}
	
	setCurrentUser(user) {
		this.currentUser = user;
	}
	
	setHeldBooks(books) {
		this.heldBooks = books;
	}
	
	setAllBooks(books) {
		this.allBooks = books;
		this.totalBooksCount = books.length;
	}
	
	getBookById(bookId){
		return this.allBooks.find(book => book.id === bookId)
	}
	
	setAllUsers(users) {
		this.allUsers = users;
	}
	
	toggleHeldBooksView() {
		this.showingHeldBooks = !this.showingHeldBooks;
		return this.showingHeldBooks;
	}
	
	isUserModerator() {
		return this.currentUser && this.currentUser.permission > 1;
	}
}