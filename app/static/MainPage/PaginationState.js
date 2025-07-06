// =============================================================================
// VIRTUAL SCROLLING CONFIGURATION
// =============================================================================

export const PAGINATION_CONFIG = {
	BOOKS_PER_PAGE: 50,
	SCROLL_THRESHOLD: 300, // pixels from bottom to trigger load
	ANIMATION_DELAY: 15, // ms between card animations
	MAX_ANIMATION_TIME: 1000 // max time for all animations
};

// =============================================================================
// PAGINATION STATE
// =============================================================================

export class PaginationState {
	constructor() {
		this.currentPage = 0;
		this.isLoading = false;
		this.hasMore = true;
		this.displayedBooks = [];
		this.allBooksToShow = [];
		this.isHeldBooksView = false;
		this.groupByCategory = true;
		this.processedCategories = new Set();
	}
	
	reset() {
		this.currentPage = 0;
		this.isLoading = false;
		this.hasMore = true;
		this.displayedBooks = [];
		this.allBooksToShow = [];
		this.processedCategories.clear();
	}
	
	setBooks(books, isHeldBooks = false, groupByCategory = true) {
		this.reset();
		this.allBooksToShow = books;
		this.isHeldBooksView = isHeldBooks;
		this.groupByCategory = groupByCategory && !isHeldBooks;
		this.hasMore = books.length > 0;
	}
	
	getNextBatch() {
		if (this.isLoading || !this.hasMore) return [];
		
		const startIndex = this.currentPage * PAGINATION_CONFIG.BOOKS_PER_PAGE;
		const endIndex = startIndex + PAGINATION_CONFIG.BOOKS_PER_PAGE;
		const batch = this.allBooksToShow.slice(startIndex, endIndex);
		
		this.currentPage++;
		this.displayedBooks.push(...batch);
		this.hasMore = endIndex < this.allBooksToShow.length;
		
		return batch;
	}
}