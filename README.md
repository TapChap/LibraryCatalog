# 📚 LibraryTrackerBackEnd API Documentation

## Base URL

```
http://<192.168.181.247:80>/
```

---

## 📖 Book Management (from `Book_api.py`)

### Book Json
# 📘 Book JSON Schema Reference

This document describes the structure of a `Book` object as returned by the backend API in different levels of detail, based on flags such as `full` and `holders`.

---

## 🧩 Base Fields (Always Included)

```json
{
  "id": "integer",
  "isTaken": "boolean",
  "quantity": "integer",
  "book_name": "string",
  "category": "string"
}
```

* `id`: Unique identifier for the book
* `isTaken`: Whether the book is currently taken (i.e., unavailable)
* `quantity`: Number of available copies
* `book_name`: The title of the book
* `category`: The book's main category

---

## 👥 Holders (Included if `holders`)

```json
{
  "holders": [ { ...user object... } ]
}
```

* `holders`: A list of users currently holding the book. Each holder is serialized using their `toJson()` method.

---

## 🧾 Full Details (Included if `full`)

```json
{
  "series": "string | null",
  "series_index": "integer | null",
  "author": "string | null",
  "sub_category": "string | null",
  "sub_category_index": "integer | null",
  "description": "string | null",
  "notes": "string | null",
  "librarian_notes": "string | null"
}
```

### 1. Add a New Book

* **Endpoint:** `POST /book/add`
* **Query Parameters (optional):**

  * `series`, `series_index`, `author`, `sub_cat`, `sub_cat_index`, `quantity`, `description`, `notes`, `librarian_notes`
* **Request Body:**

  ```json
  {
    "book_name": "string",
    "category": "string"
  }
  ```
* **Response:**

  ```json
  {
    "message": "updated bookDB",
    "Book": { ...book details... } full - ✅, holders - ❌
  }
  ```

### 2. Get Books by Name

* **Endpoint:** `GET /book/<book_name>`
* **Response:**

  ```json
  {
    "books": [ { ...all books with book_name... } ] full - ❌, holders - ❌
  }
  ```

### 3. Get Book by ID

* **Endpoint:** `GET /book/id/<id>`
* **Response:**

  ```json
  {
    "book": { ...full book details... } full - ✅, holders - ✅
  }
  ```

### 4. Get All Books

* **Endpoint:** `GET /book/all`
* **Response:**

  ```json
  [ { ...first db book... }, { ...seconds db book... }, ... ] full - ✅, holders - ✅
  ```

---

## 👤 Client Management (from `Client_api.py`)

### User Json
# 📘 User JSON Schema Reference

---

## 🧩 Base Fields (Always Included)

```json
{
  "id": "integer",
  "username": "string",
  "display_name": "string",
  "permission": "string",
  "held_books": [{ ...book details... }]
}
```

### 1. User Signup

* **Endpoint:** `POST /user/signup`
* **Request Body:**

  ```json
  {
    "username": "string",
    "display_name": "string",
    "password": "string"
  }
  ```
* **Response:**

  ```json
  {
    "message": "User created",
    "user": { ...user json... }
  }
  ```

### 2. Admin Signup

* **Endpoint:** `POST /user/signup-admin`
* **Request Body:** same as `/client/signup`
* **Permission Level:** Admin

### 3. Login

* **Endpoint:** `POST /user/login`
* **Request Body:**

  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
* **Response:**

  ```json
  {
    "message": "Logged in",
    "user": { ...user json... }
  }
  ```

### 4. Get User by Username

* **Endpoint:** `GET /user/<username>`
* **Response:**

  ```json
  { ...user json... }
  ```

### 5. Get User by ID

* **Endpoint:** `GET /user/id/<id>`
* **Response:**

  ```json
  { ...user json... }
  ```

### 6. Get User's Held Books

* **Endpoint:** `GET /user/id/<client_id>/holding`
* **Response:**

  ```json
  {
    "client": { ...client json... },
    "books": [ { ...held books json... } ]
  }
  ```

### 7. Get All Users

* **Endpoint:** `GET /user/all`
* **Response:**

  ```json
  [ { ...all users json... }, ... ]
  ```

---

## 🔁 Library Management (from `Library.py`)

### 1. Borrow Book

* **Endpoint:** `POST /library/id/<client_id>/obtain_book`
* **Request Body:**

  ```json
  {
    "book_id": <book_id>
  }
  ```
* **Response:**

  ```json
  {
    "message": "book obtained by user",
    "book": { ...book json... },
    "user": { ...client json... }
  }
  ```

### 2. Return Book

* **Endpoint:** `POST /library/id/<client_id>/return_book`
* **Request Body:**

  ```json
  {
    "book_id": <book_id>
  }
  ```
* **Response:**

  ```json
  {
    "message": "book returned from user",
    "book": { ...book json... },
    "user": { ...client json... }
  }
  ```

---

## ⚠️ Error Handling

* **400 Bad Request**: Missing or invalid fields
* **404 Not Found**: Book or user does not exist
* **409 Conflict**: Resource already exists
* **200 OK / 201 Created**: Successful operation
