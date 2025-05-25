from app.book.Book_db import createBook
from xlsxReader import readFromFile

def write_data_to_SQL(data, db):
    for book in data:
        sqlBook = createBook(*book.serialize())

        db.session.add(sqlBook)
        db.session.commit()


def xlsxToSQL(db, xlsxPath, useCols):
    data = readFromFile(xlsxPath, useCols)
    write_data_to_SQL(data, db)