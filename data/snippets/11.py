

def is_for_table(string1, string2, count):
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
