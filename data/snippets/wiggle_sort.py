# {"skip": true}
def wiggle_sort(nums):
    """
    Sorts a list of numbers
    """

    for i in range(len(nums)):
        if (i % 2 == 1) == (nums[i - 1] > nums[i]):
            nums[i - 1], nums[i] = nums[i], nums[i - 1]
