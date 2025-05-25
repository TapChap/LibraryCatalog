from flask import Flask
from client.Client_api import *
from book.Book_api import *

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:DEsyro.200506@localhost/book_sharing'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

@app.route('/')
def index():
    return "Flask is running!"

# client endpoints

@app.route('/signup', methods=['POST'])
def server_signup(permission_level=1):
    return signup(permission_level)

@app.route('/login', methods=['POST'])
def server_login():
    return login()

@app.route("/signup-admin", methods=['POST'])
def server_admin_signup():
    return admin_signup()

@app.route('/login', methods=['POST'])
def server_login():
    return login()

@app.route('/user/<string:username>')
def server_fetch_client(username):
    return fetch_client(username)

@app.route('/user/id/<int:id>')
def server_fetch_client_by_id(id):
    return fetch_client_by_id(id)

@app.route('/client/id/<int:client_id>/holding', methods=['GET'])
def server_get_held_books(client_id):
    return get_held_books(client_id)

# book endpoints

@app.route('/book/<string:book_name>', methods=['GET'])
def server_fetch_book(book_name):
    return fetch_book(book_name)

@app.route('/add_book', methods=['POST'])
def server_add_book():
    return add_book()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # create tables
    app.run(host="0.0.0.0", port=5500, debug=True)