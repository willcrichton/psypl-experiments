import pandas as pd
from scipy.stats import wasserstein_distance

from ..base import Experiment
from ..utils import all_names, rand_const, sample, shuffle


class VariableSpanExperiment(Experiment):
    all_n_var = [3, 4, 5, 6]

    def exp_name(self, N_var, N_trials):
        return f"varmem_{N_var}_{N_trials}"

    def generate_experiment(self, N_trials=40):
        trial_n_var = [N for N in self.all_n_var for _ in range(N_trials // len(self.all_n_var))]
        return {
            "trials": [self.generate_trial(N_var) for N_var in shuffle(trial_n_var)],
            "between_trials_time": 2000,
        }

    def generate_trial(self, N_var):
        names = sample(all_names, k=N_var)
        return {
            "variables": [
                {"variable": names[i], "value": rand_const()} for i in range(N_var)
            ],
            "presentation_time": N_var * 1500,
        }

    def eval_response(self, N_var, experiment, results):
        df = []
        for i, (trial, result) in enumerate(zip(experiment["trials"], results)):
            correct = 0
            badvalue = 0
            badname = 0
            for j, var in enumerate(trial["variables"]):
                for var2 in result["response"]:
                    if var["variable"] == var2["variable"]:
                        if var["value"] == int(var2["value"]):
                            correct += 1
                        else:
                            badvalue += 1
                        break
                else:
                    badname += 1

            df.append(
                {
                    "N_var": N_var,
                    "correct": correct,
                    "badvalue": badvalue,
                    "badname": badname,
                }
            )

        return pd.DataFrame(df)

    def simulate_trial(self, trial, model):
        wm = model()
        for v in trial["variables"]:
            wm.store(v["variable"], v["value"])

        response = []
        for v in trial["variables"]:
            value = wm.load(v["variable"])
            if value is not None:
                response.append({"variable": v["variable"], "value": value})

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
