from ..base import Experiment
from ..utils import shuffle, random_tree, try_int
from enum import Enum
from .variable_distance import VariableDistanceExperiment
import experiment_widgets

class TracingStrategyExperiment(Experiment):
    Widget = experiment_widgets.TracingStrategyExperiment
    Condition = VariableDistanceExperiment.Condition

    def generate_experiment(self, N_trials=10):
        conditions = list(self.Condition)
        return {
            "trials": shuffle(
                [
                    self.generate_trial(cond)
                    for cond in conditions
                    for _ in range(N_trials // len(conditions))
                ]
            ),
            "between_trials_time": 40,
            "break_frequency": 5,
        }

    def generate_trial(self, cond):
        return VariableDistanceExperiment().generate_trial(7, cond)

    def eval_trial(self, trial, result):
        return {
            "correct": 1 if int(trial["answer"]) == try_int(result["response"]) else 0,
            "cond": trial["cond"],
            'telemetry': result['telemetry']
        }
