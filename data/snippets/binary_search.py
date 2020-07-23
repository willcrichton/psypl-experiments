def binary_search(sorted_collection, item, lo=0, hi=None):
    """
    Returns the index of the smallest value greater than the item
    """
    if hi is None:
        hi = len(sorted_collection)

    while lo < hi:
        mid = (lo + hi) // 2
        if sorted_collection[mid] < item:
            lo = mid + 1
        else:
            hi = mid

    return lo
