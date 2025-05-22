from database import db

# Many-to-many relationship table for books that can be held by multiple clients
# and clients that can hold multiple books
borrowed_books_table = db.Table(
    'book_holding_table',
    db.Column('client_id', db.Integer, db.ForeignKey('client.id'), primary_key=True),
    db.Column('book_id', db.Integer, db.ForeignKey('book.id'), primary_key=True)
)

class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    display_name = db.Column(db.String(120), nullable=False)
    permission = db.Column(db.Integer, default=1)

    # Many-to-many relationship: clients can hold multiple books
    held_books = db.relationship('Book', secondary=borrowed_books_table,
                                 backref=db.backref('holders', lazy='dynamic'))

    def toJson(self):
        return {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name,
            "permission": self.permission,
            "held_books": [book.toJson() for book in self.held_books]
        }


class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book_name = db.Column(db.String(200), nullable=False)
    isTaken = db.Column(db.Boolean, default=False)
    quantity = db.Column(db.Integer, default=1)

    # The relationship to clients is defined via backref in the Client model

    def toJson(self):
        return {
            "id": self.id,
            "book_name": self.book_name,
            "isTaken": self.isTaken,
            "quantity": self.quantity,
            "holders": [holder.username for holder in self.holders]
        }