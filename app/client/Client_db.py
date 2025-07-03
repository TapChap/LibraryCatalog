from client.Permission import Permission
from models import Client
from database import db

def getClient(username):
    client = Client.query.filter_by(username=username).first()

    if not client:
        return None, 404

    return client, 200

def getClientByID(client_id):
    client = Client.query.get(client_id)

    if not client:
        return None, 404

    return client, 200

def createClient(username, display_name, permission_level, password, salt):
    client = Client(username=username, display_name=display_name, password=password, salt=salt, permission=permission_level)

    db.session.add(client)
    db.session.commit()
    return client

def toggle_permission_db(client):
    if client.permission == Permission.USER.value:
        client.permission = Permission.MODERATOR.value

    elif client.permission == Permission.MODERATOR.value:
        client.permission = Permission.USER.value

    print(client.permission)

    db.session.commit()

def delete_client(client_id):
    client, status = getClientByID(client_id)

    if status == 200:
        db.session.delete(client)
        db.session.commit()
    return status

def getAllClients():
    return Client.query.all()