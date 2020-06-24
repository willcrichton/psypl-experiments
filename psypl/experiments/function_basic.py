from enum import Enum
from random import choice

import pandas as pd

import experiment_widgets
from iterextras import unzip

from ..base import Experiment
from ..utils import (all_names, all_operators, rand_const, sample, shuffle,
                     try_int)


class FunctionBasicExperiment(Experiment):
    Widget = experiment_widgets.FunctionBasicExperiment
    all_exp = [2, 3, 4]
    all_participants = ["will"]
    num_trials = 40

    class Condition(Enum):
        NoFunction = 1
        SimpleFunction = 2
        RenameArgsFunction = 3
        RandomOrderFunction = 4

    def exp_name(self, N_var, N_trials, participant):
        return f"function_basic_{participant}_{N_var}"

    def results(self):
        return pd.concat(
            [
                self.process_results(N_var, self.num_trials, participant=participant)
                for participant in self.all_participants
                for N_var in self.all_exp
            ]
        )

    def generate_experiment(self, N_var, N_trials=30):
        conditions = list(self.Condition)
        return {
            "trials": shuffle(
                [
                    self.generate_trial(N_var, cond)
                    for cond in conditions
                    for _ in range(N_trials // len(conditions))
                ]
            ),
            "between_trials_time": 2000,
        }

    def generate_trial(self, N_var, condition):
        names = sample(all_names, k=N_var * 2)
        var_names, func_names = names[:N_var], names[N_var:]

        def gen_expr(i):
            possible_names = var_names[: i - 1]

            def gen_op():
                if len(possible_names) > 0:
                    name = choice(possible_names)
                    return name, set(name)
                else:
                    return rand_const(), set()

            if i == 0:
                return rand_const(), set()
            else:
                lhs = var_names[i - 1]
                free = set(lhs)
                if i > 1:
                    rhs = choice(var_names[: i - 1])
                    free.add(rhs)
                else:
                    rhs = rand_const()

                op = choice(all_operators)
                expr = (
                    f"{lhs} {op} {rhs}"
                    if choice([True, False])
                    else f"{rhs} {op} {lhs}"
                )
                return expr, free

        def gen_func(i, condition):
            expr, free = gen_expr(i)
            free = list(free)

            if condition == self.Condition.SimpleFunction:
                func_args = free
                call_args = free
            else:
                all_free = set([func_names[i]] + free)
                func_args = sample(list(set(all_names) - all_free), k=len(free))
                for (old, new) in zip(free, func_args):
                    expr = expr.replace(old, new)

                if condition == self.Condition.RenameArgsFunction:
                    call_args = free
                elif condition == self.Condition.RandomOrderFunction:
                    permutation = shuffle(list(range(len(func_args))))
                    func_args = [func_args[i] for i in permutation]
                    call_args = [free[i] for i in permutation]

            fbody = f'def {func_names[i]}({",".join(func_args)}):\n    return {expr}'
            fcall = f'{var_names[i]} = {func_names[i]}({",".join(call_args)})'
            return fcall, fbody

        final_expr, _ = gen_expr(N_var)
        if condition == self.Condition.NoFunction:
            program = "\n".join(
                [f"{var_names[i]} = {gen_expr(i)[0]}" for i in range(N_var)]
                + [final_expr]
            )
        else:
            calls, bodies = unzip([gen_func(i, condition) for i in range(N_var)])
            bodies = sample(bodies, k=len(bodies))
            program = "\n".join(bodies) + "\n\n" + "\n".join(calls + [final_expr])

        globls = {}
        exec(program, globls, globls)

        return {
            "program": program,
            "condition": str(condition),
            "answer": eval(final_expr, globls, globls),
        }

    def eval_response(self, N_var, experiment, results, participant):
        df = []
        for (trial, result) in zip(experiment["trials"], results):
            df.append(
                {
                    "participant": participant,
                    "N_var": N_var,
                    "correct": trial["answer"] == try_int(result["response"]),
                    "response_time": result["trial_time"],
                    "condition": trial["condition"].split(".")[1],
                }
            )
        return pd.DataFrame(df)
