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
    alphabet = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

    return "".join([alphabet[random.randint(0, 25)] for __ in range(SALT_LENGTH)])