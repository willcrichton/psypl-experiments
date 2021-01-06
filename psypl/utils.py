import string
from random import randint, sample
from dataclasses import dataclass
from typing import Any
from random import choice
from graphviz import Digraph
import seaborn as sns
from pickle_cache import PickleCache
import kanren as kr
import os
import libcst as cst
import json

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


@dataclass
class ConstNode:
    value: int

    def to_paren_str(self):
        return str(self.value)

    def to_func_str(self, _):
        return [], str(self.value)
    
    def to_mixed_str(self, names):
        return [], str(self.value)

    def to_variable_str(self, fresh, leaf_vars=False):
        if leaf_vars:
            var = fresh()
            return [f"{var} = {self.value}"], var
        else:
            return [], str(self.value)

    def _draw(self, g, vrs):
        g.node(vrs[id(self)], label=str(self.value))

    def _kanren(self, vrs):
        return []

    def depth(self):
        return {id(self): 0}

@dataclass
class OpNode:
    left: Any
    right: Any
    op: str
    index: int

    def to_paren_str(self):
        return f"({self.left.to_paren_str()} {self.op} {self.right.to_paren_str()})"

    def to_variable_str(self, fresh, leaf_vars=False):
        ldefs, lvar = self.left.to_variable_str(fresh, leaf_vars)
        rdefs, rvar = self.right.to_variable_str(fresh, leaf_vars)
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

    def draw(self, vrs, **kwargs):
        g = Digraph(**kwargs)
        self._draw(g, vrs)
        return g

    def _draw(self, g, vrs):
        self.left._draw(g, vrs)
        self.right._draw(g, vrs)

        g.node(vrs[id(self)], label=self.op)
        g.edge(vrs[id(self)], vrs[id(self.left)])
        g.edge(vrs[id(self)], vrs[id(self.right)])

    def kanren(self, vrs):
        edge = kr.Relation()
        kr.facts(edge, *self._kanren(vrs))
        return edge
    
    def _kanren(self, vrs):
        v = vrs[id(self)]
        return self.left._kanren(vrs) + self.right._kanren(vrs) + [(v, vrs[id(self.left)]), (v, vrs[id(self.right)])]

    def depth(self):
        depths = {**self.left.depth(), **self.right.depth()}
        return {id(self): 0, **{k: v + 1 for k, v in depths.items()}}

def random_tree(size, leaf_vars=False):
    index = 0

    def aux(size):
        nonlocal index
        if size == (1 if leaf_vars else 0):
            return ConstNode(rand_const())
        else:
            size -= 1
            left_size = (choice([i for i in range(1, size) if i % 2 == 1]) if leaf_vars else randint(0, size))
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


def strip_function_details(ast, name=True, comment=True):
    class Preprocessor(cst.CSTTransformer):
        def leave_FunctionDef(self, _, new_node):
            if name:
                new_node = new_node.with_changes(name=cst.Name(value='mystery'))
            if comment:
                new_node = new_node.with_deep_changes(new_node.body, body=new_node.body.body[1:])
            return new_node

    return ast.visit(Preprocessor())

def load_snippets():
    snippet_dir = os.path.join(os.path.dirname(__file__), '../data/snippets')

    def parse_snippet(s):
        ast = cst.parse_module(s)
        metadata = json.loads(ast.header[0].comment.value[1:])
        no_comment = ast.with_changes(header=[])
        return {'program': no_comment, 'metadata': metadata}

    return {
        os.path.splitext(f)[0]: parse_snippet(open(f'{snippet_dir}/{f}').read())
        for f in os.listdir(snippet_dir)
    } 
    
