from models import Book
from sqlalchemy import or_, case


def getBook(book_name):
    books = Book.query.filter_by(book_name=book_name)

    if not books.first():
        return None, 404

    return books, 200


def searchBook(query_string):
    q = f"%{query_string}%"
    q_start = f"{query_string}%"

    relevance = case(
        # Exact matches get highest priority
        (Book.book_name.ilike(query_string), 4),
        (Book.series.ilike(query_string), 4),
        # Prefix matches get second priority
        (Book.book_name.ilike(q_start), 3),
        (Book.series.ilike(q_start), 3),
        # Contains matches get lowest priority
        (Book.book_name.ilike(q), 2),
        (Book.series.ilike(q), 2),
        else_=1
    )

    books = (Book.query.filter(or_(Book.book_name.ilike(q), Book.series.ilike(q)))
             .order_by(relevance.desc(), Book.series, Book.book_name)
             .all())

    if not books:
        return [], 404
    return books, 200


def bookExists(book):
    book_copy = Book.query.filter_by(
        book_name=book.book_name,
        category=book.category,
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
