import string
from random import randint, sample
from dataclasses import dataclass
from typing import Any
from random import choice

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


@dataclass(frozen=True)
class ConstNode:
    value: int

    def to_paren_str(self):
        return str(self.value)

    def to_func_str(self, _):
        return [], str(self.value)
    
    def to_mixed_str(self, names):
        return [], str(self.value)

    def to_variable_str(self, _):
        return [], str(self.value)

@dataclass(frozen=True)
class OpNode:
    left: Any
    right: Any
    op: str
    index: int

    def to_paren_str(self):
        return f"({self.left.to_paren_str()} {self.op} {self.right.to_paren_str()})"

    def to_variable_str(self, fresh):
        ldefs, lvar = self.left.to_variable_str(fresh)
        rdefs, rvar = self.right.to_variable_str(fresh)
        var = fresh()
        return ldefs + rdefs + [f"{var} = {lvar} {self.op} {rvar}"], var

    def to_mixed_str(self, names):
        if self.index in names:
            name = names[self.index]
        else:
            name = None

        ldefs, lvar = self.left.to_mixed_str(names)
        rdefs, rvar = self.right.to_mixed_str(names)

        expr = f"({lvar} {self.op} {rvar})"

        if name is None:
            return ldefs + rdefs, expr
        else:
            return ldefs + rdefs + [f"{name} = {expr}"], name

    def to_func_str(self, fresh):
        ldefn, lcall = self.left.to_func_str(fresh)
        rdefn, rcall = self.right.to_func_str(fresh)
        name = fresh()
        return (
            [f"def {name}():\n    return {lcall} {self.op} {rcall}"]
            + ldefn
            + rdefn,
            f"{name}()",
        )

def random_tree(size):
    index = 0

    def aux(size):
        nonlocal index
        if size == 0:
            return ConstNode(rand_const())
        else:
            size -= 1
            left_size = randint(0, size)
            right_size = size - left_size
            node = OpNode(
                left=aux(left_size),
                right=aux(right_size),
                op=choice(all_operators),
                index=index
            )
            index += 1
            return node

    return aux(size)
