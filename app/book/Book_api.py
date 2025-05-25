from flask import request, abort, Blueprint

from database import db
from book.Book_db import *

book_route = Blueprint("book_bp", __name__)

@book_route.route('/add', methods=['POST'])
def add_book():
    data = request.get_json()
    book_name = data.get("book_name")
    category = data.get("category")

    print(category)

    if not book_name or not category:
        abort(400, description="error : Missing book name or category")

    # book exists in the system already incrementing quantity
    # if book := Book.query.filter_by(book_name=book_name).first():

    book, status_code = getBook(book_name)
    if status_code == 200:
        book.quantity += 1
        book.isTaken = False
    else:
        book = createBook(book_name, category)
        db.session.add(book)

    db.session.commit()

    return {"message": "updated bookDB", "Book": book.toJson()}, 201

@book_route.route('/<string:book_name>', methods=['GET'])
def fetch_book(book_name):
    book, status_code = getBook(book_name)
    if status_code == 404:
        abort(404, description="error: Book not found")

    return {"book": book.toJson(True)}, 200

@book_route.route('/id/<int:id>', methods=['GET'])
def fetch_book_by_id(id):
    book, status_code = getBookById(id)
    if status_code == 404:
        abort(404, description="error: Book not found")

    return {"book": book.toJson(True)}, 200

@book_route.route('/<int:id>/holding', methods=['GET'])
def get_book_holders(book_id):
    """Get all clients currently holding a specific book"""
    book, status_code = getBookById(book_id)
    if status_code == 404:
        abort(404, description="error: Book not found")

    # Get all clients holding this book
    holders = [{"id": client.id, "username": client.username, "display_name": client.display_name}
               for client in book.holders]

    return {
        "book_id": book_id,
        "book_name": book.book_name,
        "total_holders": len(holders),
        "holders": holders
    }, 20

@book_route.route('/all', methods=['GET'])
def get_all_books():
    books = getAllBooks()

    book_json_list = [book.toJson(True, True) for book in books]

    return book_json_list, 200