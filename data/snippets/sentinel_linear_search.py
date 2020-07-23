# {"input": "[20, 8, 4, 9, 1], 8"}
def sentinel_linear_search(sequence, target):
    """
    Searches for the index of a value in a list
    """

    sequence.append(target)

    index = 0
    while sequence[index] != target:
        index += 1

    sequence.pop()

    if index == len(sequence):
        return None

    return index
