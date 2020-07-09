from random import choice

import pandas as pd
from scipy.stats import wasserstein_distance

import experiment_widgets

from ..base import Experiment
from ..utils import all_names, rand_const, sample, shuffle, shuffle_unique


class VariableCuedRecallExperiment(Experiment):
    all_n_var = [3, 4, 5, 6]
    all_participants = ["will"]
    Widget = experiment_widgets.VariableCuedRecallExperiment

    def exp_name(self, N_var, N_trials, participant):
        return f"cuedrecall2_{participant}_{N_var}_{N_trials}"

    def results(self):
        return pd.concat(
            [
                self.process_results(N_var, 20, participant=participant)
                for participant in self.all_participants
                for N_var in self.all_exp
            ]
        )

    def eval_trial(self, trial, result):
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
        N_var = len(trial['variables'])
        return {
            "correct_raw": correct, 
            "correct_frac": correct / N_var, 
            "N_var": N_var
        }

    def generate_experiment(self, N_trials=20):
        trial_n_var = [N for N in self.all_n_var for _ in range(N_trials // len(self.all_n_var))]
        return {
            "trials": [self.generate_trial(N_var) for N_var in shuffle(trial_n_var)],
            "between_trials_time": 4000,
        }

    def generate_trial(self, N_var):
        names = sample(all_names, k=N_var)
        return {
            "variables": [
                {"variable": names[i], "value": rand_const()} for i in range(N_var)
            ],
            "recall_variables": shuffle_unique(names),
            "presentation_time": N_var * 1500,
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
