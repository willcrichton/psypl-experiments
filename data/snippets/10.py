

def mode(input_list):
    check_list = input_list.copy()
    result = list()
    for x in input_list:
        result.append(input_list.count(x))
        input_list.remove(x)
        y = max(result)
    return check_list[result.index(y)]
