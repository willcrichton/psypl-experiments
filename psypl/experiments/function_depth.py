
from dataclasses import dataclass
from enum import Enum
from random import choice, randint
from typing import Any

from ..utils import (all_names, all_operators, rand_const, sample,
                     shuffle_unique)
from .function_align import FunctionAlignExperiment


class FunctionDepthExperiment(FunctionAlignExperiment):
    all_n_var = [5]

    class Condition(Enum):
        Parentheses = 1
        Variable = 2
        Preorder = 3
        # Random = 4

    @dataclass
    class ConstNode:
        value: int

        def to_paren_str(self):
            return str(self.value)

        def to_func_str(self, _):
            return [], str(self.value)

        def to_variable_str(self, _):
            return [], str(self.value)

    @dataclass
    class OpNode:
        left: Any
        right: Any
        op: str

        def to_paren_str(self):
            return f"({self.left.to_paren_str()} {self.op} {self.right.to_paren_str()})"

        def to_variable_str(self, fresh):
            ldefs, lvar = self.left.to_variable_str(fresh)
            rdefs, rvar = self.right.to_variable_str(fresh)
            var = fresh()
            return ldefs + rdefs + [f"{var} = {lvar} {self.op} {rvar}"], var

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

    def exp_name(self, N_var, N_trials, participant):
        return f"function_depth_{participant}_{N_var}"

    def random_tree(self, size):
        if size == 1:
            return self.ConstNode(rand_const())
        else:
            left_size = randint(1, size - 1)
            right_size = size - left_size
            return self.OpNode(
                left=self.random_tree(left_size),
                right=self.random_tree(right_size),
                op=choice(all_operators),
            )

    def generate_experiment(self, N_trials=24):
        return super().generate_experiment(N_trials)

    def generate_trial(self, N_var, cond):
        tree = self.random_tree(N_var + 1)

        names = sample(all_names, k=N_var)
        i = 0

        def fresh():
            nonlocal i
            name = names[i]
            i = i + 1
            return name

        if cond == self.Condition.Parentheses:
            program = tree.to_paren_str()
            call = program
        elif cond == self.Condition.Variable:
            vardefs, call = tree.to_variable_str(fresh)
            program = "\n".join(vardefs) + "\n" + call
        else:
            defn, call = tree.to_func_str(fresh)
            # if cond == self.Condition.Random:
            #     defn = shuffle_unique(defn)
            program = "\n".join(defn) + "\n" + call

        globls = {}
        exec(program, globls, globls)
        answer = eval(call, globls, globls)

        call_str = None if cond == self.Condition.Parentheses else call
        return {"program": program, "call": call_str, "cond": str(cond), "answer": answer, "N_var": N_var}
