export class ApiClient {
	static getBaseUrl() {
		return `http://${window.CONFIG.SERVER_URL}`;
	}
	
	static async request(endpoint, options = {}) {
		const url = `${this.getBaseUrl()}${endpoint}`;
		const config = {
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			...options
		};
		
		try {
			const response = await fetch(url, config);
			const data = await response.json();
			return { response, data };
		} catch (error) {
			console.error(`API request failed: ${endpoint}`, error);
			throw error;
		}
	}
	
	static async getAllBooks() {
		const { response, data } = await this.request('/book/all');
		if (!response.ok) throw new Error(data.message || 'Failed to load books');
		return data.books || [];
	}
	
	static async searchBooks(bookName) {
		const endpoint = `/book/${encodeURIComponent(escapeHtml(bookName))}`;
		const { response, data } = await this.request(endpoint);
		if (!response.ok) return 404;
		return data.books || [];
	}
	
	static async getBookById(bookId) {
		const { response, data } = await this.request(`/book/id/${bookId}`);
		if (!response.ok) throw new Error(data.message || 'Book not found');
		return data.book;
	}
	
	static async getUserHeldBooks(userId) {
		const { response, data } = await this.request(`/user/id/${userId}/holding`);
		if (!response.ok) throw new Error(data.message || 'Failed to load held books');
		return data.books || [];
	}
	
	static async getAllUsers() {
		const { response, data } = await this.request('/user/all');
		if (!response.ok) throw new Error(data.message || 'Failed to load users');
		return data;
	}
	
	static async obtainBook(userId, bookId) {
		const { response, data } = await this.request(`/library/user/id/${userId}/obtain`, {
			method: 'POST',
			body: JSON.stringify({ book_id: bookId })
		});
		if (!response.ok) throw new Error(data.message || 'Failed to obtain book');
		return data;
	}
	
	static async returnBook(userId, bookId) {
		const { response, data } = await this.request(`/library/user/id/${userId}/return`, {
			method: 'POST',
			body: JSON.stringify({ book_id: bookId })
		});
		if (!response.ok) throw new Error(data.message || 'Failed to return book');
		return data;
	}
	
	static async deleteBook(bookId) {
		const { response } = await this.request(`/book/delete/id/${bookId}`, {
			method: 'DELETE'
		});
		if (!response.ok) throw new Error('Failed to delete book');
	}
	
	static async getSystemMessage() {
		const { response, data } = await this.request('/system_update');
		return data.update || '';
	}
	
	static async ascendUsers(username){
		const {response, data} = await this.request(`/user/admin/${username}`, {
			method: 'POST'
		});
		return response.ok
	}
}

function escapeHtml(text) {
	if (!text) return '';
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}