import pandas as pd

class xlsxBook:
    def __init__(self, xlsxIndex, book_name, category, series, series_index, author, label,
                 sub_cat, sub_cat_index, copies, desc, notes, librarian_notes):

        if pd.isna(book_name) or pd.isna(category):
            raise ValueError("missing book name or category")

        self.xlsxIndex = int(xlsxIndex)
        self.book_name = str(book_name)
        self.category = str(category)

        self.series = str(series) if not pd.isna(series) else None
        self.series_index = str(series_index) if not pd.isna(series_index) else None
        self.author = str(author) if not pd.isna(author) else None
        self.label = str(label) if not pd.isna(label) else None
        self.sub_cat = str(sub_cat) if not pd.isna(sub_cat) else None
        self.sub_cat_index = int(sub_cat_index) if not pd.isna(sub_cat_index) else None
        self.desc = str(desc) if not pd.isna(desc) else None
        self.notes = str(notes) if not pd.isna(notes) else None
        self.librarian_notes = str(librarian_notes) if not pd.isna(librarian_notes) else None

        self.quantity = int(copies) + 1 if not pd.isna(copies) else 1

    def __str__(self):
        return (f"Book(index={self.xlsxIndex!r}, book_name={self.book_name!r}, category={self.category!r}, "
                f"series={self.series!r}, series_index={self.series_index!r}, author={self.author!r},"
                f"label={self.label!r}, sub_cat={self.sub_cat!r}, sub_cat_index={self.sub_cat_index!r}, "
                f"copies={self.quantity!r}, desc={self.desc!r}, notes={self.notes!r}, librarian_notes={self.librarian_notes!r})")

    def serialize(self):
        return [
            self.book_name, self.category, self.quantity, self.series,
            self.series_index, self.author, self.label, self.sub_cat,
            self.sub_cat_index, self.desc, self.notes, self.librarian_notes
        ]
