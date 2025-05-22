from database import db

class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    display_name = db.Column(db.String(120), nullable=False)
    permission = db.Column(db.Integer, default=1)

    def toJson(self):
        return {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name,
            "permission": self.permission
        }

class Book(db.Model):
    bookId = db.Column(db.Integer, primary_key=True)
    nook_name = db.Column(db.String(200), nullable=False)
    isTaken = db.Column(db.Boolean, default=False)
    quantity = db.Column(db.Integer, default=1)
    heldById = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=True)
    heldBy = db.relationship('Client', backref='held_books', lazy=True)

    def toJson(self):
        return {
            "bookId": self.bookId,
            "book_name": self.name,
            "isTaken": self.isTaken,
            "quantity": self.quantity,
            "heldById": self.heldById,
            "heldBy": self.heldBy
        }
