import itertools
from enum import Enum

import pandas as pd

import experiment_widgets

from ..base import Experiment
from ..utils import (all_names, all_operators, interleave, rand_const, sample,
                     shuffle, shuffle_unique)


class FunctionArgsExperiment(Experiment):
    Widget = experiment_widgets.FunctionBasicExperiment
    all_exp = [2, 3, 4]
    all_participants = ["will"]

    class CallCondition(Enum):
        Constant = 1
        Variable = 2
        Shuffled = 3

    class FuncCondition(Enum):
        Ordered = 1
        Shuffled = 2

    def exp_name(self, N_var, N_trials, participant):
        return f"function_args_{participant}_{N_var}"

    def results(self):
        return pd.concat(
            [
                self.process_results(N_var, 0, participant=participant)
                for participant in self.all_participants
                for N_var in self.all_exp
            ]
        )

    def generate_experiment(self, N_var, N_trials=30):
        conditions = list(itertools.product(self.CallCondition, self.FuncCondition))
        n_conditions = len(conditions)

        return {
            "trials": shuffle(
                [
                    self.generate_trial(N_var, *conds)
                    for conds in conditions
                    for _ in range(N_trials // n_conditions)
                ]
            ),
            "between_trials_time": 2000,
        }

    def generate_trial(self, N_var, call_cond, func_cond):
        names = sample(all_names, k=N_var * 2 + 1)
        arg_names = names[:N_var]
        func_name = names[-1]
        values = [str(rand_const()) for _ in range(N_var)]

        if call_cond == self.CallCondition.Constant:
            decls = ""
            fcall = f'{func_name}({", ".join(values)})'
            call_args = values
        else:
            vrs = names[N_var:-1]
            decls = "\n".join([f"{var} = {value}" for var, value in zip(vrs, values)])
            if call_cond == self.CallCondition.Variable:
                call_args = vrs
            elif call_cond == self.CallCondition.Shuffled:
                call_args = shuffle_unique(vrs)
            else:
                raise Exception(call_cond)

        # ops = choices(all_operators, k=N_var-1)
        ops = shuffle(["-"] + sample(all_operators, k=N_var - 2))
        expr = interleave(arg_names, ops)
        if func_cond == self.FuncCondition.Ordered:
            func_args = arg_names
        elif func_cond == self.FuncCondition.Shuffled:
            func_args = shuffle_unique(arg_names)
        else:
            raise Exception(func_cond)

        fbody = f'def {func_name}({",".join(func_args)}):\n    return {expr}'
        fcall = f'{func_name}({", ".join(call_args)})'

        program = fbody + "\n\n" + decls + "\n" + fcall
        globls = {}
        exec(program, globls, globls)
        answer = eval(fcall, globls, globls)

        return {
            "program": program,
            "call_cond": str(call_cond),
            "func_cond": str(func_cond),
            "answer": answer,
        }

    def eval_response(self, N_var, experiment, results, participant):
        df = []
        for (trial, result) in zip(experiment["trials"], results):
            df.append(
                {
                    "participant": participant,
                    "N_var": N_var,
                    "correct": trial["answer"] == int(result["response"]),
                    "response_time": result["trial_time"],
                    "call_cond": trial["call_cond"],
                    "func_cond": trial["func_cond"],
                }
            )
        return pd.DataFrame(df)
