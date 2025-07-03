export class LibraryState {
	constructor() {
		this.currentUser = null;
		this.heldBooks = [];
		this.allBooks = [];
		this.allUsers = [];
		this.totalBooksCount = 0;
		this.showingHeldBooks = false;
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
	
	setAllUsers(users) {
		this.allUsers = users;
	}
	
	toggleHeldBooksView() {
		this.showingHeldBooks = !this.showingHeldBooks;
		return this.showingHeldBooks;
	}
	
	isUserAdmin() {
		return this.currentUser && this.currentUser.permission === 9;
	}
}