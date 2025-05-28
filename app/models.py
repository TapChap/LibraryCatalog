import random, passwordManager

from database import db

# Many-to-many relationship table for books that can be held by multiple clients
# and clients that can hold multiple books
borrowed_books_table = db.Table(
    'book_holding_table',
    db.Column('client_id', db.Integer, db.ForeignKey('client.id'), primary_key=True),
    db.Column('book_id', db.Integer, db.ForeignKey('book.id'), primary_key=True)
)

def genID():
    return random.randint(1000000, 9999999)


class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True, default=genID)
    username = db.Column(db.String(80), unique=True, nullable=False)
    display_name = db.Column(db.String(120), nullable=False)
    password = db.Column(db.String(64))
    salt = db.Column(db.String(passwordManager.SALT_LENGTH))
    permission = db.Column(db.Integer, default=1)

    # Many-to-many relationship: clients can hold multiple books
    held_books = db.relationship(
        'Book', secondary=borrowed_books_table,
        backref=db.backref('holders', lazy='dynamic'))

    def toJson(self):
        return {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name,
            "permission": self.permission,
            "held_books": [book.toJson() for book in self.held_books]
        }

    def validatePassword(self, password):
        return passwordManager.hashPassword(password, self.salt)[0] == self.password


class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    isTaken = db.Column(db.Boolean, default=False)
    quantity = db.Column(db.Integer, default=1)

    book_name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(200), nullable=False)

    series = db.Column(db.String(200), nullable=True)
    series_index = db.Column(db.String(30), nullable=True)
    author = db.Column(db.String(200), nullable=True)
    label = db.Column(db.String(5), nullable=True)
    sub_cat = db.Column(db.String(200), nullable=True)
    sub_cat_index = db.Column(db.Integer, nullable=True)
    description = db.Column(db.String(200), nullable=True)
    notes = db.Column(db.String(200), nullable=True)
    librarian_notes = db.Column(db.String(200), nullable=True)

    # The relationship to clients is defined via backref in the Client model

    def toJson(self, holders=False, full=False):
        json = {
            "id": self.id,
            "isTaken": self.isTaken,
            "quantity": self.quantity,
            "book_name": self.book_name,
            "category": self.category
        }

        if holders:
            json.update({
                "holders": [holder.toJson() for holder in self.holders]
            })

        if full:
            json.update({
                "series": self.series,
                "series_index": self.series_index,
                "author": self.author,
                "label": self.label,
                "sub_category": self.sub_cat,
                "sub_category_index": self.sub_cat_index,
                "description": self.description,
                "notes": self.notes,
                "librarian_notes": self.librarian_notes
            })

        return json