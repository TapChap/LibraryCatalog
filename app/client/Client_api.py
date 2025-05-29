from flask import request, abort, Blueprint

from client.Permission import Permission
from database import db
from app.client.Client_db import *
from passwordManager import hashPassword

client_route = Blueprint("client_bp", __name__)

@client_route.route('/signup', methods=['POST'])
def signup(permission_level=1):
    data = request.get_json()
    username = data.get('username')
    display_name = data.get('display_name')
    password = data.get("password")

    if not username or not display_name:
        abort(400, description="error: Missing credentials")

    if getClient(username)[1] == 200:
        abort(409, description="error: user already exists")

    # username validation
    if len(username) < 4:
        abort(400, description="error: username too short")

    if len(password) < 4:
        abort(400, description="error: password too short")

    if len(display_name) < 4:
        abort(400, description="error: display name too short")

    new_user = createClient(username, display_name, permission_level, *hashPassword(password))
    db.session.add(new_user)
    db.session.commit()

    print("user created", new_user.toJson())

    return {"message": "User created", "user": new_user.toJson()}, 201


@client_route.route("/signup-admin", methods=['POST'])
def admin_signup():
    return signup(Permission.ADMIN.value)


@client_route.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        abort(400, description="Missing username or password")

    user, status_code = getClient(username)
    if status_code == 404:
        abort(404, description="User not found")

    if not user.validatePassword(password):
        abort(401, description="Incorrect Password")

    print("logged in", user.toJson())

    return {"message": "Logged in", "user": user.toJson()}


@client_route.route('/<string:username>')
def fetch_client(username):
    client, status_code = getClient(username)
    if status_code == 404:
        return abort(404, description="User not found")

    print("client", client.toJson())

    return client.toJson()


@client_route.route('/id/<int:id>')
def fetch_client_by_id(id):
    client, status_code = getClientByID(id)
    if status_code == 404:
        return abort(404, description="User not found")

    print("client", client.toJson())

    return client.toJson()


@client_route.route('/id/<int:client_id>/holding', methods=['GET'])
def get_held_books(client_id):
    client, status_code = getClientByID(client_id)

    if status_code == 404:
        abort(404, "error: Client not found")

    held_books = [book.toJson(full=True, holders=False) for book in client.held_books]

    return {"client": client.toJson(), "books": held_books}, 200


@client_route.route('/all', methods=['GET'])
def get_client_db():
    clients = getAllClients()
    client_json_list = [client.toJson() for client in clients]
    return client_json_list, 200
