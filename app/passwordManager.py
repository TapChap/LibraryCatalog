from hashlib import sha256
import random

SALT_LENGTH = 5

def hashPassword(password, salt=''):
    hash = sha256()
    if salt == '':
        salt = generateSalt()

    hash.update(password.encode())
    hash.update(salt.encode())
    return hash.hexdigest(), salt

def generateSalt():
    chars = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        '0', "1", '2', '3', '4', '5', '6', '7', "8", '9'
    ]

    return "".join([chars[random.randint(0, len(chars))] for __ in range(SALT_LENGTH)])