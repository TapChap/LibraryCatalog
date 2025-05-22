from models import Book

def getBook(book_name):
    book = Book.query.filter_by(book_name=book_name).first()

    if not book:
        return None, 404

    return book, 200

def getBookById(book_id):
    book = Book.query.filter_by(book_id=book_id).first()

    if not book:
        return None, 404

    return book, 200

def createBook(book_name):
    return Book(book_name=book_name)
