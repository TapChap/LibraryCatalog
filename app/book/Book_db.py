from models import Book

def getBook(book_name):
    books = Book.query.filter_by(book_name=book_name)

    if not books.first():
        return None, 404

    return books, 200

def bookExists(book):
    book_copy = Book.query.filter_by(
        book_name=book.book_name,
        category = book.category,
        series=book.series,
        series_index=book.series_index,
        author=book.author,
        sub_cat=book.sub_cat,
        sub_cat_index=book.sub_cat_index).first()

    if not book_copy:
        return None, 404

    return book_copy, 200

def getBookById(book_id):
    book = Book.query.get(book_id)

    if not book:
        return None, 404

    return book, 200

def createBook(book_name, category, quantity=1,
               series="", series_index="", author="", label="", sub_cat="",
               sub_cat_index=0, desc="", notes="", librarian_notes=""):
    return Book(
        book_name=book_name, category=category,

        series=series,
        series_index=series_index,
        author=author,
        label=label,
        sub_cat=sub_cat,
        sub_cat_index=sub_cat_index,
        quantity=quantity,
        description=desc,
        notes=notes,
        librarian_notes=librarian_notes
    )

def equals(book1, book2):
    if not book1 or not book2:
        return False

    return (
            book1.book_name == book2.book_name and
            book1.category == book2.category and
            book1.series == book2.series and
            book1.series_index == book2.series_index and
            book1.author == book2.author and
            book1.label == book2.label and
            book1.sub_cat == book2.sub_cat and
            book1.sub_cat_index == book2.sub_cat_index
    )

def getAllBooks():
    return Book.query.all()