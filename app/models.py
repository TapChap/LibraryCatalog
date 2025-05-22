from database import db

borrowd_books_table = db.Table(
    'book_holding_table',
    db.Column('client_id', db.Integer, db.ForeignKey('client.id'), primary_key=True),
    db.Column('book_id', db.Integer, db.ForeignKey('book.id'), primary_key=True)
)

class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    display_name = db.Column(db.String(120), nullable=False)
    permission = db.Column(db.Integer, default=1)

    held_books = db.relationship('Book', secondary=borrowd_books_table, backref=db.backref('holders', lazy='dynamic'))

    def toJson(self):
        return {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name,
            "permission": self.permission
        }


class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book_name = db.Column(db.String(200), nullable=False)
    isTaken = db.Column(db.Boolean, default=False)
    quantity = db.Column(db.Integer, default=1)

    heldById = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=True)
    heldBy = db.relationship('Client', backref='held_books', lazy=True)

    def toJson(self):
        return {
            "id": self.id,
            "book_name": self.book_name,
            "isTaken": self.isTaken,
            "quantity": self.quantity,
            "heldById": self.heldById,
            "heldBy": self.heldBy
        }
