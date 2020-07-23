# {"input": "[3, 7, 2, 10, 1]"}
def count_inversions(arr):
    """
    Returns the number of pairs of elements where one is higher in the array
    but less in value
    """

    num_inversions = 0
    n = len(arr)

    for i in range(n - 1):
        for j in range(i + 1, n):
            if arr[i] > arr[j]:
                num_inversions += 1

    return num_inversions
