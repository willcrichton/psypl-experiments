from enum import Enum
from ..utils import random_tree, ConstNode, OpNode, all_names, shuffle, try_int
from random import sample
from itertools import combinations, product
from ..base import Experiment
from pprint import pprint
import pandas as pd
import numpy as np
import experiment_widgets

# https://stackoverflow.com/questions/15306231/how-to-calculate-all-interleavings-of-two-lists
def slot_combinations(A,B):
    slots = [None]*(len(A) + len(B))
    for splice in combinations(range(0,len(slots)),len(B)):
        it_B = iter(B)
        for s in splice:
            slots[s] = next(it_B)
        it_A = iter(A)
        slots = [e if e else next(it_A) for e in slots]
        yield slots
        slots = [None]*(len(slots))

def all_toposorts(tree):
    if isinstance(tree, ConstNode):
        return [[tree]]
    else:
        left_sorts = all_toposorts(tree.left)
        right_sorts = all_toposorts(tree.right)
        return [
            prefix + [tree]
            for left, right in product(left_sorts, right_sorts)
            for prefix in slot_combinations(left, right)
        ]

class VariableDistanceExperiment(Experiment):
    Widget = experiment_widgets.FunctionBasicExperiment

    class Condition(Enum):
        Close = 1
        Far = 2


    def generate_experiment(self, N_trials=2):
        conditions = list(self.Condition)
        return {
            "trials": shuffle(
                [
                    self.generate_trial(N_var=7, cond=cond)
                    for cond in conditions
                    for _ in range(N_trials // len(conditions))
                ]
            ),
            "between_trials_time": 4000,
        }
        

    def generate_trial(self, N_var, cond):
        tree = random_tree(N_var, leaf_vars=True)

        names = sample(all_names, k=N_var)

        df = []
        for sort in all_toposorts(tree):
            stmts = []
            var_names = {}

            i = 0
            def fresh():
                nonlocal i
                name = names[i]
                i = i + 1
                return name

            distances = {}
            for j, node in enumerate(sort):
                var_names[id(node)] = fresh()
                if j < len(sort) - 1:
                    distances[id(node)] = j

                if isinstance(node, ConstNode):
                    stmts.append(f'{var_names[id(node)]} = {node.value}')
                else:
                    distances[id(node.left)] = j - distances[id(node.left)]
                    left_value = var_names[id(node.left)]

                    distances[id(node.right)] = j - distances[id(node.right)]
                    right_value = var_names[id(node.right)]
                    
                    stmts.append(f'{var_names[id(node)]} = {left_value} {node.op} {right_value}')

            df.append({
                'program': '\n'.join(stmts),
                'call': var_names[id(sort[-1])],
                'distance': np.mean(list(distances.values()))
            })

        df = pd.DataFrame(df).drop_duplicates().sort_values('distance')

        if cond == self.Condition.Close:
            row = df.iloc[0]
        elif cond == self.Condition.Far:
            row = df.iloc[-1]

        globls = {}
        exec(row.program, globls, globls)
        answer = eval(row.call, globls, globls)

        return {
            'program': row.program,
            'call': row.call,
            'cond': str(cond),
            'N_var': N_var,
            'answer': str(answer)
        }

    def eval_trial(self, trial, result):
        return {
            "correct": 1 if int(trial["answer"]) == try_int(result["response"]) else 0,
            "cond": trial["cond"]
        }
