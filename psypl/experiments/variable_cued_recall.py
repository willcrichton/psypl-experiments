from random import choice

import pandas as pd
from scipy.stats import wasserstein_distance

import experiment_widgets

from ..base import Experiment
from ..utils import all_names, rand_const, sample


class VariableCuedRecallExperiment(Experiment):
    all_exp = [3, 4, 5, 6]
    all_participants = ["will"]
    num_to_recall = 2
    num_trials = 20
    Widget = experiment_widgets.VariableCuedRecallExperiment

    def exp_name(self, N_var, N_trials, participant):
        return f"cuedrecall2_{participant}_{N_var}_{N_trials}"

    def results(self):
        return pd.concat(
            [
                self.process_results(N_var, self.num_trials, participant=participant)
                for participant in self.all_participants
                for N_var in self.all_exp
            ]
        )

    def generate_trial(self, N):
        names = sample(all_names, k=N)
        return {
            "variables": [
                {"variable": names[i], "value": rand_const()} for i in range(N)
            ],
            "recall_variables": sample(names, k=self.num_to_recall),
            "presentation_time": N * 1500,
        }

    def eval_response(self, N_var, experiment, results, participant):
        df = []
        for (trial, result) in zip(experiment["trials"], results):
            gt = {v["variable"]: v["value"] for v in trial["variables"]}
            correct = sum(
                [
                    1
                    if "value" in response
                    and gt[response["variable"]] == int(response["value"])
                    else 0
                    for response in result["response"]
                ]
            )
            df.append({"correct": correct, "N_var": N_var, "participant": participant})

        return pd.DataFrame(df)

    def generate_experiment(self, N_var, N_trials):
        return {
            "trials": [self.generate_trial(N_var) for _ in range(N_trials)],
            "between_trials_time": 2000,
        }

    def simulate_trial(self, trial, model):
        wm = model()
        for v in trial["variables"]:
            wm.store(v["variable"], v["value"])
        values = [v["value"] for v in trial["variables"]]

        response = []
        for v in trial["recall_variables"]:
            value = wm.load(v)
            if value is None:
                value = choice(values)
            response.append({"variable": v, "value": value})

        return response

    def simulation_loss(self, gt, sim):
        def dists(df):
            return [
                df[df.N_var == N_var].correct.tolist()
                for N_var in sorted(df.N_var.unique())
            ]

        return sum(
            [
                wasserstein_distance(gt_dist, sim_dist)
                for gt_dist, sim_dist in zip(dists(gt), dists(sim))
            ]
        )
