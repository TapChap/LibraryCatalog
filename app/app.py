from flask import request, abort

from database import db
from book.Book_db import *
from client.Client_db import *
from server import app

@app.route('/client/id/<int:client_id>/obtain_book', methods=['POST'])
def obtain_book(client_id):
    data = request.get_json()
    book_id = data.get("book_id")

    if not book_id:
        abort(400, description="error: Missing book id")

    book, status_code = getBookById(book_id)
    if status_code == 404:
        abort(404, description="error: Book not found")

    client, status_code = getClientByID(client_id)
    if status_code == 404:
        abort(404, description="error: User not found")

    # Check if book is available
    if book.isTaken:
        abort(400, description="error: Book not available")

    # Check if client already has this book
    if book in client.held_books:
        abort(400, description="error: Client already has this book")

    # Decrease quantity and add to client's held books
    book.quantity -= 1
    book.isTaken = book.quantity == 0  # Mark as taken if no copies left

    client.held_books.append(book)

    db.session.commit()

    return {
        "message": "book obtained by user",
        "book": book.toJson(),
        "user": client.toJson()
    }, 200