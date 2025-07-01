from database import db
from models import Dictionary

def system_update(request):
    if request.method == 'POST':
        data = request.get_json()
        update_content = data.get("content")

        if update_content:
            update_systemUpdate(update_content)
        else:
            reset_system_update()

        return {'message': "update sent successfully"}, 200

    else: # request.method == 'GET'
        if update := get_systemUpdate():
            return {"update": update.value}, 200
        return {"message": "update not found"}, 404


def get_systemUpdate():
    return Dictionary.query.get('sysUpdate')

def update_systemUpdate(newUpdate):
    db.session.merge(Dictionary(key='sysUpdate', value=newUpdate))
    db.session.commit()

def reset_system_update():
    db.session.delete(get_systemUpdate())
    db.session.commit()