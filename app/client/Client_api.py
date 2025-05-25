from flask import request, abort

from app.Permission import Permission
from app.database import db
from app.server import app
from app.client.Client_db import *

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

@app.route('/user/<string:username>')
def getClientName(username):
    return getClient(username)[0].toJson()


@app.route('/client/id/<int:client_id>/holding', methods=['GET'])
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

