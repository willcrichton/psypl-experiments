# {"input": "\"ABCDE\", \"EDCBA\", 4", "schema": true}
def check_diff(string1, string2, count):
    """
    Returns whether the number of different characters in string1/string2
    is the same as count
    """

    l1 = list(string1)
    l2 = list(string2)
    count_n = 0
    for i in range(len(l1)):
        if l1[i] != l2[i]:
            count_n += 1
    if count_n == count:
        return True
    else:
        return False
