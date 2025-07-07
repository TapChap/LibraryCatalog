import pandas as pd
from book.xlsxBook import xlsxBook
from book.Book_db import createBook, addBookToDB

def loadDBfromFile(path, location):
    df = pd.read_excel(path, usecols="A:M")
    df = df.dropna(how='all')

    data = []

    for index, row in df.iterrows():
        index += 1
        try:
            data.append(xlsxBook(
                index, row["שם"], row["קטגוריה"], location,
                row["סדרה"], row["כרך"], row["מחבר"], row["תווית"], row["תת-קטגוריה"],
                row["קאטר"], row["כפילויות"], row["תיאור"], row["הערות"], row["הערות ספרן"]))
        except:
            raise Exception(f"error at row {index+1}")

    for book in data:
        addBookToDB(createBook(*book.serialize()), False)