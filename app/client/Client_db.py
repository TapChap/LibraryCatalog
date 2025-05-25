from app.models import Client

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

def createClient(username, display_name, permission_level):
    client = Client(username=username, display_name=display_name, permission=permission_level)
    return client