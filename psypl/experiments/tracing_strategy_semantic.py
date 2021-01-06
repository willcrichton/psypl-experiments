from ..base import Experiment
from ..utils import shuffle, random_tree, try_int, load_snippets, strip_function_details
from enum import Enum
import experiment_widgets

SNIPPETS = load_snippets()

class TracingStrategySemanticExperiment(Experiment):
    Widget = experiment_widgets.TracingStrategyExperiment

    def generate_experiment(self, N_trials=3):
        conditions = ['check_diff', 'count_inversions', 'is_palindrome']
        assert len(conditions) == N_trials
        return {
            "trials": shuffle(
                [
                    self.generate_trial(cond)
                    for cond in conditions
                ]
            ),
            "between_trials_time": 4000,
            "break_frequency": 5,
        }

    def generate_trial(self, name):
        snippet = SNIPPETS[name]
        program = strip_function_details(snippet['program'], name=False, comment=True)
        metadata = snippet['metadata']

        call = f'{name}({metadata["input"]})'
        
        globls = {}
        exec(program.code, globls, globls)
        answer = eval(call, globls, globls)

        return {
            'program': program.code,
            'call': call,
            'function': name,
            'answer': str(answer)
        }

    def eval_trial(self, trial, result):
        return {
            "correct": 1 if str(trial["answer"]).lower() == str(result["response"]).lower() else 0,
            'response': result['response'],
            'telemetry': result['telemetry']
        }
