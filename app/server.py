from flask import Flask
from database import db

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:DEsyro.200506@localhost/book_sharing'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

@app.route('/')
def index():
    return "Flask is running!"

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # create tables
    app.run(host="0.0.0.0", port=5500, debug=True)