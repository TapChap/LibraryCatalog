import pandas as pd
from book.xlsxBook import xlsxBook
from book.Book_db import createBook

def readFromFile(path, location):
    df = pd.read_excel(path, usecols="A:M")
    df = df.dropna(how='all')

    data = []

    for index, row in df.iterrows():
        index += 1
        print(index + 1)
        try:
            data.append(xlsxBook(
                index, row["שם"], row["קטגוריה"], location,
                row["סדרה"], row["מספר בסדרה"], row["מחבר"], row["תווית"], row["תת-קטגוריה"],
                row["קאטר"], row["כפילויות"], row["תיאור"], row["הערות"], row["הערות ספרן"]))
        except ValueError:
            raise Exception(f"error at row {index+1}, incorrect data type")

    return data

def writeToSQL(data, db):
    for book in data:
        sqlBook = createBook(*book.serialize())

        db.session.add(sqlBook)
    db.session.commit()