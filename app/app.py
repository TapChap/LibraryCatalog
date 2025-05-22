from flask import Flask, request, abort

from Permission import Permission
from database import db
from BookManager import *
from ClientManager import *

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:DEsyro.200506@localhost/book_sharing'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

@app.route('/')
def index():
    return "Flask is running!"

@app.route('/signup', methods=['POST'])
def signup(permission_level=1):
    data = request.get_json()
    username = data.get('username')
    display_name = data.get('display_name')

    if not username or not display_name:
        abort(400, description="error: Missing username or display_name")

    if getClient(username)[1] == 200:
        abort(409, description="error: user already exists")

    new_user = createClient(username, display_name, permission_level)
    db.session.add(new_user)
    db.session.commit()

    return {"message": "User created", "user": new_user.toJson()}, 201

@app.route("/signup-admin", methods=['POST'])
def admin_signup():
    return signup(Permission.ADMIN.value)

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')

    if not username:
        abort(400, description="Missing username")

    user, status_code = getClient(username)
    if status_code == 404:
        abort(404, description="User not found")

    return {"message": "Logged in", "user": user.toJson()}

@app.route('/add_book', methods=['POST'])
def add_book():
    data = request.get_json()
    book_name = data.get("book_name")

    if not book_name:
        abort(400, description="error : Missing book name")

    # book exists in the system already incrementing quantity
    # if book := Book.query.filter_by(book_name=book_name).first():

    book, status_code = getBook(book_name)
    if status_code == 200:
        book.quantity += 1
    else:
        book = createBook(book_name)
        db.session.add(book)

    db.session.commit()

    return {"message": "updated bookDB", "Book": book.toJson()}, 201

@app.route('/book/<string:book_name>', methods=['GET'])
def fetch_book(book_name):
    book, status_code = getBook(book_name)
    if status_code == 404:
        abort(404, description="error: Book not found")

    return {"book": book.toJson()}, 200

@app.route('/book/id/<int:book_id>', methods=['GET'])
def fetch_book_by_id(book_id):
    book, status_code = getBookById(book_id)
    if status_code == 404:
        abort(404, description="error: Book not found")

    return {"book": book.toJson()}, 200


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

@app.route('/client/id/<int:client_id>/held_books', methods=['GET'])
def get_held_books(client_id):
    client, status_code = getClientByID(client_id)

    if status_code == 404:
        abort(404, "error: Client not found")

    # Return JSON serializable data
    held_books = [book.toJson() for book in client.held_books]

    return {
        "client_id": client_id,
        "client_name": client.display_name,
        "held_books": held_books
    }, 200


@app.route('/book/id/<int:book_id>/holders', methods=['GET'])
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
    }, 200