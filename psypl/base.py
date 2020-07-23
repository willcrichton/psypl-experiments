import pandas as pd
import hyperopt
import itertools
import json
from copy import deepcopy
import re

from .utils import pcache


class Experiment:
    @classmethod
    def name_parts(cls):
        name = cls.__name__
        return re.sub(r'(?<!^)(?=[A-Z])', '_', name).split('_')

    def pcache_key(self, participant):
        raise NotImplementedError

    def eval_response(self, experiment, results):
        raise NotImplementedError

    def process_results(self, participant, **kwargs):
        data = pcache.get(self.exp_name(participant, **kwargs))
        experiment = data["experiment"]
        results = data["results"]
        return self.eval_response(N_var, experiment, results, **kwargs)

    def results(self):
        return pd.concat([self.process_results(N_var, 10) for N_var in self.all_exp])

    def save_results(self, N_var, N_trials, partcipant, experiment, results):
        pkey = self.exp_name(N_var, N_trials, participant)
        prev_results = pcache.get(
            pkey, lambda: {"experiment": {**experiment, "trials": []}, "results": []}
        )
        prev_results["experiment"]["trials"].extend(experiment["trials"])
        prev_results["results"].extend(results)
        pcache.set(pkey, prev_results)

    def run_experiment(self, participant, N_var, N_trials=20, dummy=False):
        exp_desc = self.generate_experiment(N_var=N_var, N_trials=N_trials)
        exp_widget = self.Widget(experiment=json.dumps(exp_desc), results=json.dumps([]))

        def on_result_change(_):
            if not dummy:
                self.save_results(
                    N_var, N_trials, participant, exp_desc, json.loads(exp_widget.results))

        exp_widget.observe(on_result_change)
        return exp_widget

    def get_mongo_results(self, collection):
        mongo_data = collection.find_one({'experiment_name': self.__class__.__name__})['participants']
        results = []
        for participant, data in mongo_data.items():
            if isinstance(data['trials'][0], list):
                it = zip(data['trials'][0], data['results'][0])
            else:
                it = zip(data['trials'], data['results'])

            for trial_index, (trial, result) in enumerate(it):
                results.append({
                    'participant': participant,
                    'mturk': 'mturk-' in participant,
                    'trial_index': trial_index,
                    "duration": result['trial_time'] / 1000.,
                    **(data['demographics'] if 'demographics' in data else {}),
                    **self.eval_trial(trial, result)
                })
        return pd.DataFrame(results)


