import itertools
from random import choice

import pandas as pd
from scipy.stats import wasserstein_distance

import experiment_widgets

from ..base import Experiment
from ..utils import all_names, all_operators, rand_const, sample


class VariableArithmeticSequenceExperiment(Experiment):
    all_exp = [0]
    Widget = experiment_widgets.VariableArithmeticSequenceExperiment

    def exp_name(self, N_var, N_trials, participant=None):
        return f"vararithseq_{N_trials}"

    def results(self):
        return pd.concat([self.process_results(N_var, 20) for N_var in self.all_exp])

    def generate_expression(self, variables):
        if len(variables) == 0:
            value = rand_const()
            return str(value), value
        elif len(variables) == 1:
            rhs = rand_const()
            op = choice(all_operators)
            expression = f"{variables[0]['variable']} {op} {rhs}"
            value = eval(f"{variables[0]['value']} {op} {rhs}")
            return expression, value
        else:
            [lhs, rhs] = sample(variables, k=2)
            op = choice(all_operators)
            expression = f"{lhs['variable']} {op} {rhs['variable']}"
            value = eval(f"{lhs['value']} {op} {rhs['value']}")
            return expression, value

    def generate_experiment(self, N_trials=20):
        return {
            "trials": [self.generate_trial() for _ in range(N_trials)],
            "between_trials_time": 4000,
        }

    def generate_trial(self):
        K = 20
        names = sample(all_names, k=K)
        variables = []
        for i in range(K):
            expression, value = self.generate_expression(variables)
            variables.append(
                {"variable": names[i], "expression": expression, "value": value}
            )

        return {"variables": variables, "wait_time": 2000}

    def analyze_error(self, variables, expression, guess):
        return "calculation" # TODO
        # possible_values = [v["value"] for v in variables]
        # ast = parse(expression).statements[0].value
        # if len(variables) == 0:
        #     return "calculation"

        # op = ast.operator
        # for (a, b) in itertools.permutations(possible_values, 2):
        #     if op.eval(a, b) == guess:
        #         return "substitution"
        # return "calculation"

    def eval_response(self, N_var, experiment, results):
        df = []
        for (trial, result) in zip(experiment["trials"], results):
            result = result["response"]
            variables = trial["variables"]
            i = result["i"]
            error = self.analyze_error(
                variables[:i], variables[i]["expression"], result["value"]
            )
            df.append({"stage": i, "error": error})
        return pd.DataFrame(df)

    def simulate_trial(self, trial, model):
        wm = model()

        for i, var in enumerate(trial["variables"]):
            name = var["variable"]
            stmt = parse(f"{name} = {var['expression']}").statements[0]
            wm.trace_stmt(stmt)
            response = wm.load(name)
            response = response if response is not None else rand_const()
            if response != var["value"]:
                return {"i": i, "value": response}

        return {"i": i, "value": 0}

    def simulation_loss(self, gt, sim):
        def dists(df):
            return [
                df[df.error == error].stage.tolist()
                for error in sorted(df.error.unique())
            ]

        def stats2(df):
            counts = df.groupby("error").size() / len(df)
            return counts.values.tolist()[0]

        mse_group_proportion = (stats2(gt) - stats2(sim)) ** 2

        return (
            sum(
                [
                    wasserstein_distance(gt_dist, sim_dist)
                    for (gt_dist, sim_dist) in zip(dists(gt), dists(sim))
                ]
            )
            + mse_group_proportion * 10
        )
