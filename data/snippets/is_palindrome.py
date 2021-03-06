# {"input": "\"attack\"", "schema": true}
def is_palindrome(s):
    """
    Returns true if the string is a palindrome (same spelling forward and reverse)
    """

    start_i = 0
    end_i = len(s) - 1
    while start_i < end_i:
        if s[start_i] == s[end_i]:
            start_i += 1
            end_i -= 1
        else:
            return False
    return True
