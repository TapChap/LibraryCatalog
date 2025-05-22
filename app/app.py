from flask import Flask, request

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
        return {"error": "Missing username or display_name"}, 400

    if getClient(username)[1] == 200:
        return {"error": "user already exists"}, 409

    new_user = createClient(username, display_name, permission_level)
    db.session.add(new_user)
    db.session.commit()

    return {"message": "User created", "user": new_user.to_dict()}, 201

@app.route("/signup-admin", methods=['POST'])
def admin_signup():
    return signup(Permission.ADMIN.value)

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')

    if not username:
        return {"error": "Missing username"}, 400

    user, status_code = getClient(username)
    if status_code == 404:
        return {"error": "User not found"}, 404

    return {"message": "Logged in", "user": user.toJson()}

@app.route('/add_book', methods=['POST'])
def add_book():
    data = request.get_json()
    book_name = data.get("book_name")

    if not book_name:
        return {"error : Missing book name"}, 400

    # book exists in the system already incrementing quantity
    # if book := Book.query.filter_by(book_name=book_name).first():

    book, status_code = getBook(book_name)
    if status_code == 200:
        book.quantity += 1
    else:
        book = createBook(book_name)
        db.session.add(book)

    db.session.commit()

    return {"message": "updated bookDB", "newBook": book.toJson()}, 201

@app.route('/book/<string:book_name>', methods=['GET'])
def fetch_book(book_name):
    book, status_code = getBook(book_name)
    if status_code == 404:
        return {"error": "Book not found"}, 404

    return {"book": book.toJson()}, 200

@app.route('/borrow', methods=['POST'])
def obtain_book():
    data = request.get_json()
    book_id = data.get("book_id")
    client_id = data.get("obtainer_id")

    if not book_id or not client_id:
        if not book_id:
            return {"error: Missing book Id"}, 400
        return {"error: obtainer book Id"}, 400

    book, status_code = getBookById(book_id)
    if status_code == 404:
        return {"error: Book not found"}, 404

    client, status_code = getClientByID(client_id)
    if status_code == 404:
        return {"error: User not found"}, 404

    return {
        "message": "book obtained by user",
        "book": book.toJson(),
        "user": client.toJson()
    }

