from enum import Enum

class Permission(Enum):
    USER = 1
    MODERATOR = 2
    EDITOR = 3
    ADMIN = 9