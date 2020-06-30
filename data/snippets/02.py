def check_pangram(input_str):
    frequency = set()
    input_str = input_str.replace(
        " ", ""
    )
    
    for alpha in input_str:
        if "a" <= alpha.lower() <= "z":
            frequency.add(alpha.lower())

    return True if len(frequency) == 26 else False
