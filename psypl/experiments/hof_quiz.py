from ..base import Experiment
from ..utils import shuffle
from . import loop_tasks
from .hof_quiz_shared import Condition
import textwrap
import tempfile
import subprocess as sp
import experiment_widgets
import pandas as pd
from random import choices
import importlib
from os.path import dirname, basename, isfile, join
from glob import glob
import traceback

# LANG = "python"
# module_paths = glob(join(dirname(__file__), "loop_tasks", LANG, "*.py"))
# modules = [importlib.import_module(f'.loop_tasks.{LANG}.{basename(path)[:-3]}', package='psypl.experiments') 
#            for path in module_paths if '__init__' not in path]

from .loop_tasks.python import largest_average_population
modules = [largest_average_population]
questions = [mod.TASK for mod in modules]

# class Bug(Enum):
#     Correct = 0
#     Init = 1
#     Index = 2
#     Missing = 3

class HofQuizExperiment(Experiment):
    Widget = experiment_widgets.HofQuizExperiment

    def generate_all(self):
        return [
            self.generate_trial(q, p.cond, p.correct) 
            for q in questions
            for p in q.programs
        ]

    def run_rust_program(self, program, test):
        with tempfile.NamedTemporaryFile() as f:
            f.write((program + f'\nfn main() {{ {test} }}').encode('utf-8'))
            f.flush()

            try:
                sp.check_output(['rustc', f.name, '-o', '/tmp/ex'], stderr=sp.PIPE)
            except sp.CalledProcessError as e:
                print(program)
                print(e.stderr.decode('utf-8'))
                raise

            try:
                sp.check_output(['/tmp/ex'], stderr=sp.PIPE)
                return True, ''
            except sp.CalledProcessError as e:
                return False, e.stderr.decode('utf-8')

    def run_python_program(self, program, test):
        globls = {}
        full_source = f'{program}\n{test}'
        try:
            exec(full_source, globls, globls)
            return True, ''
        except Exception:
            return False, traceback.format_exc()
                
    def generate_experiment(self, N_trials=len(questions)):
        cond = choices(list(Condition), k=N_trials)
        correct = choices([False, True], k=N_trials)
        return {
            'trials': shuffle([self.generate_trial(q, c, ct) for q, c, ct in zip(questions, cond, correct)]),
            'between_trials_time': 40,
            'break_frequency': 5
        }

    def generate_trial(self, q, cond, correct):
        p = [p for p in q.programs if p.cond == cond and p.correct == correct][0]
        source = q.gen_program(p)
        return {
            'prompt': q.prompt,
            'answer': correct,
            'test': q.test,
            'cond': str(cond),
            'program': source,
            'question': q.name
        }

    def eval_trial(self, trial, response):
        return {'correct': trial['answer'] == response['response']}
