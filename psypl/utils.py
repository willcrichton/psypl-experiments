import string
from random import randint, sample

import seaborn as sns
from pickle_cache import PickleCache

sns.set()
pcache = PickleCache()
all_names = list(set(string.ascii_lowercase) - set(["l", "i"]))
all_operators = ["+", "-"]


def shuffle(l):
    return sample(l, k=len(l))


def shuffle_unique(l):
    while True:
        l2 = shuffle(l)
        if l2 != l:
            return l2


def rand_const():
    return randint(1, 9)


def try_int(s):
    try:
        return int(s)
    except ValueError:
        return None


def interleave(base, sep):
    l = []
    for i in range(len(base)):
        if i > 0:
            l.append(sep[i - 1])
        l.append(base[i])
    return " ".join(l)
