from random import choices

import pandas as pd

from ..base import Experiment
from ..utils import all_names, all_operators, rand_const, sample


class VariableArithmeticExperiment(Experiment):
    all_exp = [2, 3, 4, 5]

    def exp_name(self, N_var, N_trials):
        return f"vararithmem_{N_var}_{N_trials}"

    def eval_response(self, N_var, experiment, results, participant=None):
        rows = []
        for (trial, result) in zip(experiment["trials"], results):
            try:
                response = int(result["response"])
            except ValueError:
                continue

            rows.append(
                {
                    "N_var": N_var,
                    "correct": 1 if trial["expression_value"] == response else 0,
                }
            )

        return pd.DataFrame(rows)

    def generate_trial(self, N):
        names = sample(all_names, k=N)
        variables = [{"variable": names[i], "value": rand_const()} for i in range(N)]

        expr_var_order = sample(variables, k=len(variables))
        operators = choices(all_operators, k=N - 1)
        expr_list = []
        expr_value = expr_var_order[0]["value"]
        for i in range(N):
            if i > 0:
                op = operators[i - 1]
                expr_value = eval(f"{expr_value} {op} {expr_var_order[i]['value']}")
                expr_list.append(op)
            expr_list.append(expr_var_order[i]["variable"])
        expr = " ".join(expr_list)

        return {
            "variables": variables,
            "expression": expr,
            "expression_value": expr_value,
            "presentation_time": 500 + N * 1500,
        }

    def simulate_trial(self, trial, model):
        wm = model()

        for var in trial["variables"]:
            wm.store(var["variable"], var["value"])

        expr = parse(trial["expression"]).statements[0].value
        return wm.trace_expr(expr)
