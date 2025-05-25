import json
import os
import uuid

from flask import Flask
from sqlalchemy import text

from client.Client_api import *
from book.Book_api import *
from Library import *
from xlsxToSQL import xlsxToSQL

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:DEsyro.200506@localhost/book_sharing'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

app.register_blueprint(client_route, url_prefix="/user")
app.register_blueprint(book_route, url_prefix="/book")
app.register_blueprint(library_route, url_prefix="/library")

@app.route('/')
def index():
    return "Flask is running!"

@app.route('/loadFromFile', methods=['POST'])
def loadFromFile():
    json_data = request.form.get('dataColumns')
    file = request.files.get('data')

    # UPLOAD_DIR = "uploads"
    # os.makedirs(UPLOAD_DIR, exist_ok=True)

    filename = f"{uuid.uuid4()}_{file.filename}"
    # save_path = os.path.join(UPLOAD_DIR, filename)
    file.save(filename)

    xlsxToSQL(db, filename, json.loads(json_data).get('dataColumns'))
    os.remove(filename)

    return {"success": "successfully loaded from file"}, 201

@app.route('/book/drop', methods=['POST'])
def drop_book_table():
    result = runSQL("TRUNCATE TABLE book RESTART IDENTITY CASCADE;")

    if not result:
        return {"result" : "dropped table"}, 200
    return result

def runSQL(sql_string):
    """
    Executes a raw SQL command.
    Safely handles commands that don't return rows (e.g., DROP, ALTER).
    """
    try:
        with db.engine.begin() as connection:
            result = connection.execute(text(sql_string))
            # Only fetch rows if the statement returns them
            if result.returns_rows:
                return result.fetchall()
            else:
                return None
    except Exception as e:
        print(f"SQL execution error: {e}")
        return None


if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # create tables
    app.run(host="0.0.0.0", port=5500, debug=True)