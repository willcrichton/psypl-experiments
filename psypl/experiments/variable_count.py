from enum import Enum
from ..utils import random_tree, ConstNode, OpNode, all_names, shuffle, try_int
from random import sample
from itertools import combinations, product
from ..base import Experiment
from pprint import pprint
import pandas as pd
import numpy as np
import experiment_widgets

class VariableCountExperiment(Experiment):
    Widget = experiment_widgets.FunctionBasicExperiment
    all_n_op = [6, 9]
    all_n_var = [0, 2, 4]

    class Condition(Enum):
        #Random = 1
        Even = 1
        Frontloaded = 2

    def generate_experiment(self, N_trials=24):
        conditions = list(product(self.all_n_var, self.all_n_op, list(self.Condition)))
        return {
            "trials": shuffle(
                [
                    self.generate_trial(*conds)
                    for conds in conditions
                    for _ in range(N_trials // len(conditions))
                ]
            ),
            "between_trials_time": 4000,
        }

    def node_size(self, t, idxs):
        if isinstance(t, OpNode):
            lmap, lsize = self.node_size(t.left, idxs)
            rmap, rsize = self.node_size(t.right, idxs)
            size = lsize + rsize + 1
            if t.index in idxs:
                return {t.index: size, **lmap, **rmap}, 0
            else:
                return {**lmap, **rmap}, size
        else:
            return {}, 0

    def generate_trial(self, N_var, N_op, cond):
        tree = random_tree(N_op)

        if N_var > 0:
            coverings = pd.DataFrame([{
                'sizes': self.node_size(tree, idxs)[0],
                'remaining': self.node_size(tree, idxs)[1],
                'idxs': idxs
            } for idxs in combinations(list(range(N_op-1)), N_var)])
            coverings['size_seq'] = coverings.apply(
                lambda row: [t[1] for t in sorted(row.sizes.items(), key=lambda t: t[0])] + [row.remaining],
                axis=1)

            if cond == self.Condition.Even:
                coverings.score = coverings.size_seq.map(lambda seq: np.std(seq))
            elif cond == self.Condition.Frontloaded:
                def compute_score(seq):
                    return np.sum([(i+1) * seq[i] for i in range(len(seq))])
                coverings['score'] = coverings.size_seq.map(compute_score)

            best_rows = coverings[coverings.score == coverings.score.min()]
            row = best_rows.sample().iloc[0]
            indices = row.idxs
            size_seq = row.size_seq

            names = sample(all_names, k=N_var)
            defs, call = tree.to_mixed_str({i: n for i, n in zip(indices, names)})
        else:
            defs = []
            call = tree.to_paren_str()
            size_seq = [N_op]

        program = '\n'.join(defs + [call])

        globls = {}
        exec(program, globls, globls)
        answer = eval(call, globls, globls)

        return {
            'program': program,
            'call': call if N_var > 0 else None,
            'cond': str(cond),
            'N_var': N_var,
            'N_op': N_op,
            'size_seq': size_seq,
            'answer': str(answer)
        }

    def eval_trial(self, trial, result):
        return {
            "correct": 1 if int(trial["answer"]) == try_int(result["response"]) else 0,
            "cond": trial["cond"]
        }
