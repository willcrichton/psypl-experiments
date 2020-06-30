def generate_table(key):

    alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"
    table = []

    for char in key.upper():
        if char not in table and char in alphabet:
            table.append(char)

    for char in alphabet:
        if char not in table:
            table.append(char)

    return table
