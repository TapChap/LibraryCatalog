from flask import request, Blueprint

import book.Book_db as db

book_route = Blueprint("book_bp", __name__)
yovel_book_route = Blueprint("yovel_book_bp", __name__)

@book_route.route('/add', methods=['POST'])
@yovel_book_route.route('/add', methods=['POST'])
def add_book():
    data = request.get_json()
    book_name = data.get("book_name")
    category = data.get("category")

    # Get other parameters from URL query string
    location = request.args.get("location")
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

    new_book = db.createBook(
        book_name, category, quantity=quantity, location=location,
        series=series, series_index=series_index, author=author,
        label=label, sub_cat=sub_cat, sub_cat_index=sub_cat_index,
        desc=desc, notes=notes, librarian_notes=librarian_notes)

    return {"message": "updated bookDB", "Book": new_book.toJson(full=True)}, 201


@book_route.route('/<string:book_name>', methods=['GET'])
@yovel_book_route.route('/<string:book_name>', methods=['GET'])
def fetch_books(book_name):
    books, status_code = db.searchBook(book_name)
    if status_code == 404:
        return {"message": "Book not found"}, 404

    books = [book.toJson(full=True) for book in books]

    return {"books": books}, 200


@book_route.route('/id/<int:id>', methods=['GET'])
@yovel_book_route.route('/id/<int:id>', methods=['GET'])
def fetch_book_by_id(id):
    book, status_code = db.getBookById(id)
    if status_code == 404:
        return {"message": "Book not found"}, 404

    return {"book": book.toJson(False if isRequestFromYovel(request.path) else True, True)}, 200

@yovel_book_route.route('/id/<int:id>/holders')
def fetch_book_holders(id):
    book, status_code = db.getBookById(id)
    if status_code == 404:
        return {"message": "Book not found"}, 404

    return {"holders": [holder.toJson(False) for holder in book.holders]}, 200

@book_route.route('/all', methods=['GET'])
@yovel_book_route.route('/all', methods=['GET'])
def get_all_books():
    books = db.getAllBooks()

    book_json_list = [book.toJson(True, True) for book in books]

    return {"books": book_json_list}, 200

@book_route.route('/delete/id/<int:book_id>', methods={'DELETE'})
@yovel_book_route.route('/delete/id/<int:book_id>', methods={'DELETE'})
def delete_book(book_id):
    book, status = db.getBookById(book_id)
    print(book, status)

    if status == 200:
        db.deleteBook(book)
        return {"message": "book deleted successfully"}, 200

    return {"message": "book not found"}, 404

def isRequestFromYovel(reqPath):
    return reqPath.split('/')[1] == 'books'