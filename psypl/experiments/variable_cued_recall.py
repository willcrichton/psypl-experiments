from random import choice, choices
from enum import Enum

import pandas as pd
from scipy.stats import wasserstein_distance

import experiment_widgets
import itertools

from ..base import Experiment
from ..utils import all_names, rand_const, sample, shuffle, shuffle_unique, try_int

# https://www.jstor.org/stable/1413449?seq=2#metadata_info_tab_contents
nonsense_syllables = [
    "vus",
    "yif",
    "mav",
    "jep",
    "vob",
    "wof",
    "feg",
    "tib",
    "nuz",
    "bof",
    "jed",
    "kib",
    "vel",
    "zid",
    "bol",
    "sef",
    "yab",
    "kub",
    "tef",
    "nad",
]

# https://www.randomlists.com/nouns?dup=false&qty=25
words = [s.strip() for s in """roll
curtain
plot
playground
cave
furniture
market
cherries
soda
coast
ice
basketball
card
argument
tax
push
geese
iron
industry
ticket
board
cabbage
vacation
bait
visitor""".split('\n')]

class VariableCuedRecallExperiment(Experiment):
    all_n_var = [10]
    all_participants = ["will"]
    Widget = experiment_widgets.VariableCuedRecallExperiment

    class Condition(Enum):
        Letter = 1
        Syllable = 2
        Word = 3

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
                and gt[response["variable"]] == try_int(response["value"])
                    else 0
                    for response in result["response"]
            ]
        )
        N_var = len(trial['variables'])
        return {
            "correct_raw": correct, 
            "correct_frac": correct / N_var, 
            "N_var": N_var,
            "cond": trial['cond']
        }

    def generate_experiment(self, N_trials=8):
        conditions = list(itertools.product(self.all_n_var, [self.Condition.Letter, self.Condition.Word])) #list(self.Condition)))
        n_conditions = len(conditions)

        return {
            "trials":
            shuffle([
                self.generate_trial(*conds) for conds in conditions
                for _ in range(N_trials // n_conditions)
            ]),
            "between_trials_time": 4000,
            "break_frequency": 4
        }

    def generate_trial(self, N_var, cond):
        if cond == self.Condition.Letter:
            l = all_names
        elif cond == self.Condition.Syllable:
            l = nonsense_syllables
        elif cond == self.Condition.Word:
            l = words
            
        names = sample(l, k=N_var)
        values = choices(list(range(0, 10)), k=N_var)
        return {
            "variables": [
                {"variable": name, "value": value} for name, value in zip(names, values)
            ],
            "recall_variables": shuffle_unique(names),
            "presentation_time": N_var * 1500,
            "cond": str(cond)
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
