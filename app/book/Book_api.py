from flask import request, Blueprint

from database import db
from book.Book_db import *

book_route = Blueprint("book_bp", __name__)


@book_route.route('/add', methods=['POST'])
def add_book():
    data = request.get_json()
    book_name = data.get("book_name")
    category = data.get("category")

    # Get other parameters from URL query string
    series = request.args.get("series")
    series_index = request.args.get("series_index")
    author = request.args.get("author")
    label = request.args.get("label")
    sub_cat = request.args.get("sub_cat")
    sub_cat_index = request.args.get("sub_cat_index", type=int)
    quantity = request.args.get("quantity", default=1, type=int)
    desc = request.args.get("description")
    notes = request.args.get("notes")
    librarian_notes = request.args.get("librarian_notes")

    if not book_name or not category:
        return {"message": "Missing book name or category"}, 400

    new_book = createBook(
        book_name, category, quantity=quantity,
        series=series, series_index=series_index, author=author,
        label=label, sub_cat=sub_cat, sub_cat_index=sub_cat_index,
        desc=desc, notes=notes, librarian_notes=librarian_notes)

    book, status_code = bookExists(new_book)
    if status_code == 200 and equals(book, new_book):
        book.quantity += new_book.quantity
        book.isTaken = False

        book.description = new_book.description
        book.notes = new_book.notes
        book.librarian_notes = new_book.librarian_notes
    else:
        db.session.add(new_book)

    db.session.commit()

    return {"message": "updated bookDB", "Book": new_book.toJson(full=True)}, 201


@book_route.route('/<string:book_name>', methods=['GET'])
def fetch_books(book_name):
    books, status_code = getBook(book_name)
    if status_code == 404:
        return {"message": "Book not found"}, 404

    books = [book.toJson(full=True) for book in books]

    return {"books": books}, 200


@book_route.route('/id/<int:id>', methods=['GET'])
def fetch_book_by_id(id):
    book, status_code = getBookById(id)
    if status_code == 404:
        return {"message": "Book not found"}, 404

    return {"book": book.toJson(True, True)}, 200

@book_route.route('/all', methods=['GET'])
def get_all_books():
    books = getAllBooks()

    book_json_list = [book.toJson(True, True) for book in books]

    return {"books": book_json_list}, 200
