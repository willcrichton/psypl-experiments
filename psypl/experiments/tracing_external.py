import experiment_widgets
from ..base import Experiment
from ..utils import shuffle, random_tree

class TracingExternalExperiment(Experiment):
    Widget = experiment_widgets.TracingExternalExperiment

    def generate_experiment(self, N_trials=24):
        conditions = [None]
        return {
            "trials": shuffle(
                [
                    self.generate_trial(*conds)
                    for conds in conditions
                    for _ in range(N_trials // len(conditions))
                ]
            ),
            "between_trials_time": 4000,
        }

    def generate_trial(self, _):
        t = random_tree(6)
        defs, call = t.to_variable_str()

        return {
            'program': ''
        }
