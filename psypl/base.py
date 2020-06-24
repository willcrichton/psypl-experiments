import pandas as pd
import hyperopt
import itertools
import json
from copy import deepcopy

from .utils import pcache


class Experiment:
    def exp_name(self, N_var, N_trials):
        raise NotImplementedError

    def eval_response(self, N_var, experiment, results):
        raise NotImplementedError

    def process_results(self, N_var, N_trials, **kwargs):
        data = pcache.get(self.exp_name(N_var, N_trials, **kwargs))
        experiment = data["experiment"]
        results = data["results"]
        return self.eval_response(N_var, experiment, results, **kwargs)

    def results(self):
        return pd.concat([self.process_results(N_var, 10) for N_var in self.all_exp])

    def param_search(self, model, space, N_trials=300, timeout=120, **kwargs):
        gt = self.results()

        def objective(args):
            kwargs = {
                param.inputs()[0].pos_args[0].eval(): arg
                for arg, param in zip(args, space)
            }
            sim = self.simulate(N_trials=N_trials, model=lambda: model(**kwargs))
            return self.simulation_loss(gt, sim)

        trials = hyperopt.Trials()
        best_params = hyperopt.fmin(
            objective,
            space,
            algo=hyperopt.tpe.suggest,
            timeout=timeout,
            trials=trials,
            **kwargs
        )
        all_params = pd.DataFrame(
            [
                {
                    **{k: v[0] for k, v in trial["misc"]["vals"].items()},
                    "loss": trial["result"]["loss"],
                }
                for trial in trials.trials
            ]
        )
        return best_params, all_params

    def simulate_trials(self, N_var, N_trials, model):
        experiment = self.generate_experiment(N_var, N_trials)

        response = [
            {"response": self.simulate_trial(trial, model)}
            for trial in experiment["trials"]
        ]

        return self.eval_response(N_var, experiment, response, participant="simulation")

    def simulate(self, model, N_trials=1000):
        return pd.concat(
            [self.simulate_trials(N_var, N_trials, model) for N_var in self.all_exp]
        )

    def run_experiment(self, participant, N_var, N_trials=20, dummy=False):
        exp_desc = self.generate_experiment(N_var=N_var, N_trials=N_trials)
        exp = self.Widget(experiment=json.dumps(exp_desc), results="[]")

        pkey = self.exp_name(N_var, N_trials, participant)
        prev_results = pcache.get(
            pkey, lambda: {"experiment": {**exp_desc, "trials": []}, "results": []}
        )

        def on_result_change(_):
            if not dummy:
                prev_copy = deepcopy(prev_results)
                prev_copy["experiment"]["trials"].extend(exp_desc["trials"])
                prev_copy["results"].extend(json.loads(exp.results))
                pcache.set(pkey, prev_copy)

        exp.observe(on_result_change)
        return exp
