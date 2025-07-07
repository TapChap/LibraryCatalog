import os, uuid, mimetypes

from flask import Flask, render_template, send_from_directory, Response
from flask_cors import CORS
from sqlalchemy import text
from waitress import serve

import system_update
from client.Client_api import *
from book.Book_api import *
from Library_api import *
from xlsx_helper import *
from dotenv import load_dotenv

load_dotenv()
mimetypes.add_type('application/javascript', '.js')


app = Flask(__name__)
CORS(app)

DB_USERNAME = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
MACHINE = os.getenv("MACHINE")

PORT = os.getenv("PORT")
HOST = os.getenv("HOST")
SERVER_IP = os.getenv("SERVER_IP")

app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{DB_USERNAME}:{DB_PASSWORD}@localhost/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

app.register_blueprint(client_route, url_prefix="/user")
app.register_blueprint(yovel_client_route, url_prefix="/users")
app.register_blueprint(book_route, url_prefix="/book")
app.register_blueprint(yovel_book_route, url_prefix="/books")
app.register_blueprint(library_route, url_prefix="/library")

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/')
def index():
    return render_template("landing.html")

@app.route('/home')
def home():
    return render_template("home.html")

@app.route('/admin')
def admin():
    return render_template("admin.html")

@app.route('/system_update', methods=['GET', 'POST'])
def system_update_api():
    return system_update.system_update(request)

@app.route('/loadFromFile', methods=['POST'])
def loadFromFile():
    location = request.args.get('location')

    file = request.files.get('data')

    filename = f"{uuid.uuid4()}_{file.filename}"
    file.save(filename)

    loadDBfromFile(filename, location)

    os.remove(filename)

    return {"success": "successfully loaded from file"}, 201

@app.route("/config.js")
def config_js():
    js = f'window.CONFIG = {{ SERVER_URL: "{SERVER_IP}" }};'
    return Response(js, mimetype='application/javascript')

@app.route('/drop/<string:table>', methods=['POST'])
def drop_table(table):
    if table == 'book':
        result = runSQL("TRUNCATE TABLE book RESTART IDENTITY CASCADE;") #drop table values
    elif table == 'user':
        result = runSQL("TRUNCATE TABLE client RESTART IDENTITY CASCADE;") #drop table values
    else:
        result = "invalid table name"
    # result = runSQL("DROP TABLE book CASCADE") #drop table itself

    if not result:
        return {"result": "dropped table"}, 200
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
            return None
    except Exception as e:
        print(f"SQL execution error: {e}")
        return None

if __name__ == '__main__':
    if MACHINE == 'dev':
        with app.app_context():
            db.create_all()
        app.run(host=HOST, port=PORT, debug=True)

    elif MACHINE == 'prod':
        with app.app_context():
            db.create_all()
            serve(app, host=HOST, port=PORT)
