# {"input": "[2, 0, 4, 3, 0, 1]", "schema": true}
def mode(input_list):
    """
    Returns the statistical mode of the list
    """

    result = list()
    for x in input_list:
        result.append(input_list.count(x))
    y = max(result)
    return input_list[result.index(y)]

