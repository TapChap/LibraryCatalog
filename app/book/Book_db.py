from models import Book

def getBook(book_name):
    book = Book.query.filter_by(book_name=book_name).first()

    if not book:
        return None, 404

    return book, 200

def getBookById(book_id):
    book = Book.query.get(book_id)

    if not book:
        return None, 404

    return book, 200

def createBook(book_name, category, quantity=1,
               series="", series_index="", author="", sub_cat="",
               sub_cat_index=0, desc="", notes="", librarian_notes=""):
    return Book(
        book_name=book_name, category=category, series=series, series_index=series_index,
        author=author, sub_cat=sub_cat, sub_cat_index=sub_cat_index, quantity=quantity,
        description=desc, notes=notes, librarian_notes=librarian_notes
    )

def getAllBooks():
    return Book.query.all()