import re
import client.Client_db as db

from flask import request, Blueprint
from passwordManager import hashPassword

client_route = Blueprint("client_bp", __name__)
yovel_client_route = Blueprint("yovel_client_bp", __name__)

@client_route.route('/signup', methods=['POST'])
@yovel_client_route.route('/signup', methods=['POST'])
def signup(permission_level=1):
    data = request.get_json()
    username: str = data.get('username')
    display_name: str = data.get('display_name')
    password: str = data.get("password")

    # username validation
    if not username or len(username) < 3:
        return {"message": "Username too short", "offending_field": "username"}, 400

    if not re.fullmatch(r"[a-z0-9א-ת._]+", username):
        return {"message": "Username may only contain lowercase & hebrew letters, digits, '.' and '_'  characters", "offending_field": "username"}, 400

    if not password or len(password) < 4:
        return {"message": "Password too short", "offending_field": "password"}, 400

    if not display_name or len(display_name) < 4:
        return {"message": "Display name too short", "offending_field": "display_name"}, 400

    if db.getClient(username)[1] == 200:
        return {"message": "User already exists", "offending_field": "username"}, 409

    new_user = db.createClient(username.strip(), display_name.strip(), permission_level, *hashPassword(password))

    return {"message": "User created", "user": new_user.toJson()}, 201


@client_route.route('/admin/<string:username>', methods=['POST'])
@yovel_client_route.route('/admin/<string:username>', methods=['POST'])
def ascend_permission(username):
    user, status_code = db.getClient(username)
    if status_code == 404:
        return {"message": "User not found"}, 400

    db.ascend_permission_db(user)
    return {"message": "ascended user to admin permission"}, 200

@client_route.route('/delete/id/<int:user_id>', methods=['DELETE'])
@yovel_client_route.route('/delete/id/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    status = db.delete_client(user_id)

    if status == 200:
        return {"message": "deleted user"}, 200
    return {"message": "user not found"}, 404

@client_route.route('/login', methods=['POST'])
@yovel_client_route.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return {"message": "Missing username or password"}, 400

    user, status_code = db.getClient(username)
    if status_code == 404:
        return {"message": "User not found"}, 400

    if not user.validatePassword(password):
        return {"message": "Incorrect Password"}, 401

    print("logged in", user.toJson())

    return {"message": "Logged in", "user": user.toJson()}, 200

@client_route.route('/<string:username>')
@yovel_client_route.route('/<string:username>')
def fetch_client(username):
    client, status_code = db.getClient(username)
    if status_code == 404:
        return {"message": "User not found"}, 404

    print("client", client.toJson())

    return client.toJson(), 200


@client_route.route('/id/<int:id>')
@yovel_client_route.route('/id/<int:id>')
def fetch_client_by_id(id):
    client, status_code = db.getClientByID(id)
    if status_code == 404:
        return {"message": "User not found"}, 404

    print("client", client.toJson())

    return client.toJson(not isRequestFromYovel(request.path)), 200


@client_route.route('/id/<int:client_id>/holding', methods=['GET'])
@yovel_client_route.route('/id/<int:client_id>/holding', methods=['GET'])
def get_held_books(client_id):
    client, status_code = db.getClientByID(client_id)

    if status_code == 404:
        return {"message": "User not found"}, 404

    held_books = [book.toJson(full=True, holders=False) for book in client.held_books]

    if isRequestFromYovel(request.path):
        return {"books": held_books}, 200
    return {"client": client.toJson(False), "books": held_books}, 200

@client_route.route('/all', methods=['GET'])
@yovel_client_route.route('/all', methods=['GET'])
def get_client_db():
    clients = db.getAllClients()
    client_json_list = [client.toJson() for client in clients]
    return client_json_list, 200

def isRequestFromYovel(reqPath):
    return reqPath.split('/')[1] == 'users'