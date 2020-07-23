def check_pangram(input_str):
    """
    Checks whether the input string is a pangram (contains all letters a-z)
    """

    frequency = set()
    input_str = input_str.replace(
        " ", ""
    )

    for alpha in input_str:
        if "a" <= alpha.lower() <= "z":
            frequency.add(alpha.lower())

    return True if len(frequency) == 26 else False
