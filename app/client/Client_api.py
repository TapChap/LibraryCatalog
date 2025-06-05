import re

from flask import request, Blueprint

from client.Permission import Permission
from database import db
from app.client.Client_db import *
from passwordManager import hashPassword

client_route = Blueprint("client_bp", __name__)

@client_route.route('/signup', methods=['POST'])
def signup(permission_level=1):
    data = request.get_json()
    username: str = data.get('username')
    display_name: str = data.get('display_name')
    password: str = data.get("password")

    # username validation
    if not username or len(username) < 4:
        return {"message": "Username too short", "offending_field": "username"}, 400

    if not re.fullmatch(r"[a-z0-9._]+", username):
        return {"message": "Username may only contain lowercase letters, digits, '.' and '_'  characters", "offending_field": "username"}, 400

    if not password or len(password) < 4:
        return {"message": "Password too short", "offending_field": "password"}, 400

    if not display_name or len(display_name) < 4:
        return {"message": "Display name too short", "offending_field": "display_name"}, 400

    if getClient(username)[1] == 200:
        return {"message": "User already exists", "offending_field": "username"}, 409

    new_user = createClient(username, display_name, permission_level, *hashPassword(password))
    db.session.add(new_user)
    db.session.commit()

    print("user created", new_user.toJson())

    return {"message": "User created", "user": new_user.toJson()}, 201


@client_route.route('/admin/<string:username>', methods=['POST'])
def ascend_permission(username):
    user, status_code = getClient(username)
    if status_code == 404:
        return {"message": "User not found"}, 400

    user.permission = Permission.ADMIN.value
    db.session.commit()

    return {"message": "Assigned as Admin", "user": user.toJson()}, 200

@client_route.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return {"message": "Missing username or password"}, 400

    user, status_code = getClient(username)
    if status_code == 404:
        return {"message": "User not found"}, 400

    if not user.validatePassword(password):
        return {"message": "Incorrect Password"}, 401

    print("logged in", user.toJson())

    return {"message": "Logged in", "user": user.toJson()}, 200


@client_route.route('/<string:username>')
def fetch_client(username):
    client, status_code = getClient(username)
    if status_code == 404:
        return {"message": "User not found"}, 404

    print("client", client.toJson())

    return client.toJson(), 200


@client_route.route('/id/<int:id>')
def fetch_client_by_id(id):
    client, status_code = getClientByID(id)
    if status_code == 404:
        return {"message": "User not found"}, 404

    print("client", client.toJson())

    return client.toJson(), 200


@client_route.route('/id/<int:client_id>/holding', methods=['GET'])
def get_held_books(client_id):
    client, status_code = getClientByID(client_id)

    if status_code == 404:
        return {"message": "User not found"}, 404

    held_books = [book.toJson(full=True, holders=False) for book in client.held_books]

    return {"client": client.toJson(False), "books": held_books}, 200


@client_route.route('/all', methods=['GET'])
def get_client_db():
    clients = getAllClients()
    client_json_list = [client.toJson() for client in clients]
    return client_json_list, 200
