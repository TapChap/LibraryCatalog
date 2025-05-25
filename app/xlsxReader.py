import pandas as pd

df = pd.read_excel("catalog.xlsx", usecols="A:M")

data = []

for index, row in df.iterrows():
    data.append((index + 1, row["שם הספר"], row["סדרה"], row["מספר בסדרה"], row["מחבר"], row["קטגוריה"], row["תת-קטגוריה"], row["קאטר"], row["כפילויות"], row["תיאור"], row["הערות"], row["הערות ספרן"]))

for item in data:
    print(item)