from models import Book
from sqlalchemy import or_, and_, case
from database import db

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
        (Book.author.ilike(query_string), 4),
        (Book.category.ilike(query_string), 4),
        (Book.label.ilike(query_string), 4),
        # Prefix matches get second priority
        (Book.book_name.ilike(q_start), 3),
        (Book.series.ilike(q_start), 3),
        (Book.author.ilike(q_start), 3),
        (Book.category.ilike(q_start), 3),
        (Book.label.ilike(q_start), 3),
        # Contains matches get lowest priority
        (Book.book_name.ilike(q), 2),
        (Book.series.ilike(q), 2),
        (Book.author.ilike(q), 2),
        (Book.category.ilike(q), 2),
        (Book.label.ilike(q), 2),
        else_=1)

    books = (Book.query.filter(or_(
        Book.book_name.ilike(q),
        Book.series.ilike(q),
        Book.author.ilike(q),
        Book.category.ilike(q),
        Book.label.ilike(q)))
             .order_by(relevance.desc(),
                   Book.series,
                   Book.book_name,
                   Book.author,
                   Book.category,
                   Book.label)
             .all())

    if not books:
        return [], 404
    return books, 200


def findBook(book):
    book_copy = (Book.query.filter_by(
        book_name=book.book_name,
        category=book.category,
        sub_cat=book.sub_cat,
        series=book.series,
        series_index=book.series_index,
        author=book.author,
        label=book.label,
        sub_cat_index=book.sub_cat_index,
        location=book.location).first())

    if not book_copy:
        return None, 404

    return book_copy, 200


def getBookById(book_id):
    book = Book.query.get(book_id)

    if not book:
        return None, 404

    return book, 200


def createBook(book_name, category, quantity=1, location="",
               series="", series_index="", author="", label="", sub_cat="",
               sub_cat_index=0, desc="", notes="", librarian_notes=""):
    return Book(
        book_name=book_name, category=category,
        location=location,
        series=series,
        series_index=series_index,
        author=author,
        label=label,
        sub_cat=sub_cat,
        sub_cat_index=sub_cat_index,
        available_count=quantity,
        copies=quantity,
        description=desc,
        notes=notes,
        librarian_notes=librarian_notes
    )

def addBookToDB(book, incExistingBooks = True):
    existingBook, status_code = findBook(book)
    if status_code == 200:
        if incExistingBooks:
            existingBook.available_count += book.available_count
            existingBook.copies += book.available_count
            existingBook.is_taken = False

            existingBook.description=book.description,
            existingBook.notes=book.notes,
            existingBook.librarian_notes=book.librarian_notes,
    else:
        db.session.add(book)

    db.session.commit()

def equals(book1, book2):
    if not book1 or not book2:
        return False

    return (
            book1.book_name == book2.book_name and
            book1.category == book2.category and
            book1.location == book2.location and
            book1.series == book2.series and
            book1.series_index == book2.series_index and
            book1.author == book2.author and
            book1.label == book2.label and
            book1.sub_cat == book2.sub_cat and
            book1.sub_cat_index == book2.sub_cat_index
    )

def deleteBook(book):
    db.session.delete(book)
    db.session.commit()

def updateBook(book, data):
    data = dict(data)
    for key, val in data.items():
        book.__setattr__(key, val)

    db.session.commit()

def getAllBooks():
    relevance = case(
        (Book.category.ilike('תנ"ך'), 21),
        (Book.category.ilike("תנאים"), 20),
        (Book.category.ilike("תלמוד"), 19),
        (Book.category.ilike("גאונים"), 18),
        (Book.category.ilike("ראשונים"), 17),
        (Book.category.ilike("אחרונים"), 16),
        (Book.category.ilike("ספרי מצוות"), 15),
        (Book.category.ilike("הלכה"), 14),
        (Book.category.ilike('שותי"ם'), 13),
        (Book.category.ilike("תורת הנסתר"), 12),
        (Book.category.ilike("חסידות"), 11),
        (Book.category.ilike("מוסר"), 10),
        (Book.category.ilike("סידור התפילה והגדה של פסח"), 9),
        (Book.category.ilike("מחשבה"), 8),
        (Book.category.ilike('מחקר התנ"ך'), 7),
        (Book.category.ilike('חז"ל'), 6),
        (Book.category.ilike("היסטוריה"), 5),
        (Book.category.ilike("מחשבת ישראל"), 4),
        (Book.category.ilike("םילוסופיה ומדעי החברה"), 3),
        (Book.category.ilike("שירה וספרות"), 2),
        else_= 1
    )

    return Book.query.order_by(relevance.desc(), Book.category).order_by(Book.series)