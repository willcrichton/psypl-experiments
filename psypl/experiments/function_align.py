from enum import Enum
from random import choices
import itertools

import pandas as pd

import experiment_widgets

from ..base import Experiment
from ..utils import (all_names, all_operators, interleave, rand_const, sample,
                     shuffle, shuffle_unique)


class FunctionAlignExperiment(Experiment):
    Widget = experiment_widgets.FunctionBasicExperiment
    all_n_var = [3, 4, 5, 6]
    all_participants = ["will"]

    class Condition(Enum):
        Aligned = 1
        Misaligned = 2

    def exp_name(self, N_var, N_trials, participant):
        return f"function_align_{participant}_{N_var}"

    def results(self):
        return pd.concat([
            self.process_results(N_var, 0, participant=participant)
            for participant in self.all_participants for N_var in self.all_exp
        ])

    def generate_experiment(self, N_trials=40):
        conditions = list(itertools.product(self.all_n_var, list(self.Condition)))
        n_conditions = len(conditions)

        return {
            "trials":
            shuffle([
                self.generate_trial(*conds) for conds in conditions
                for _ in range(N_trials // n_conditions)
            ]),
            "between_trials_time":
            2000,
        }

    def generate_trial(self, N_var, cond):
        names = sample(all_names, k=N_var + 1)
        arg_names = names[:N_var]
        func_name = names[-1]
        values = [str(rand_const()) for _ in range(N_var)]

        call_args = values
        ops = shuffle(["-"] + choices(all_operators, k=N_var - 2))

        expr = interleave(shuffle_unique(arg_names), ops)
        func_args = arg_names

        fbody = f'def {func_name}({", ".join(func_args)}):\n    return {expr}'
        fcall = f'{func_name}({", ".join(call_args)})'

        if cond == self.Condition.Aligned:
            program = f"    {fcall}\n{fbody}"
        elif cond == self.Condition.Misaligned:
            program = f"{fbody}\n\n{fcall}"

        globls = {}
        exec(fbody, globls, globls)
        answer = eval(fcall, globls, globls)

        return {"program": program, "call": fcall, "cond": str(cond), "answer": answer}

    def eval_response(self, N_var, experiment, results, participant):
        df = []
        for (trial, result) in zip(experiment["trials"], results):
            df.append({
                "participant": participant,
                "N_var": N_var,
                "correct": trial["answer"] == int(result["response"]),
                "response_time": result["trial_time"],
                "cond": trial["cond"],
            })
        return pd.DataFrame(df)
