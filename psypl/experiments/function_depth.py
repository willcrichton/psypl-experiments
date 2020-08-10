from enum import Enum
from random import choice, randint

from ..utils import (all_names, all_operators, rand_const, sample,
                     shuffle_unique, random_tree)
from .function_align import FunctionAlignExperiment


class FunctionDepthExperiment(FunctionAlignExperiment):
    all_n_var = [5]

    class Condition(Enum):
        Parentheses = 1
        Variable = 2
        Preorder = 3
        # Random = 4

    def exp_name(self, N_var, N_trials, participant):
        return f"function_depth_{participant}_{N_var}"

    def generate_experiment(self, N_trials=24):
        return super().generate_experiment(N_trials)

    def generate_trial(self, N_var, cond):
        tree = random_tree(N_var + 1)

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
