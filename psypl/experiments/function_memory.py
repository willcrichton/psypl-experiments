import experiment_widgets
from ..base import Experiment
from ..utils import shuffle, random_tree, sample, all_names, try_int
import libcst as cst
from libcst.metadata import ByteSpanPositionProvider
from itertools import product

class SeparateBlocks(cst.CSTVisitor):
    def __init__(self):
        self.functions = []
        self.toplevel = []
        self.in_func = 0

    def visit_FunctionDef(self, fdef):
        self.functions.append(fdef)
        self.in_func += 1
        
    def leave_FunctionDef(self, _):
        self.in_func -= 1

    def visit_SimpleStatementLine(self, stmt):
        if self.in_func == 0:
            self.toplevel.append(stmt)


class AnalyzeCalls(cst.CSTVisitor):
    METADATA_DEPENDENCIES = (ByteSpanPositionProvider,)

    def __init__(self):
        self.calls = []

    def visit_Call(self, call):
        pos = self.get_metadata(ByteSpanPositionProvider, call)
        self.calls.append((call.func.value, pos))


class FunctionMemoryExperiment(Experiment):
    Widget = experiment_widgets.FunctionMemoryExperiment
    all_n_var = [3, 5]

    def generate_experiment(self, N_trials=10):
        conditions = self.all_n_var
        return {
            "trials": shuffle(
                [
                    self.generate_trial(cond)
                    for cond in conditions
                    for _ in range(N_trials // len(conditions))
                ]
            ),
            "between_trials_time": 4000,
            "break_frequency": 5,
        }

    def generate_trial(self, N_var):
        tree = random_tree(N_var)
        names = sample(all_names, k=N_var)
        i = 0

        def fresh():
            nonlocal i
            name = names[i]
            i = i + 1
            return name

        defn, call = tree.to_func_str(fresh)
        program = '\n'.join(defn) + '\n' + call

        globls = {}
        exec(program, globls, globls)
        answer = eval(call, globls, globls)

        mod = cst.parse_module(program)
        separator = SeparateBlocks()
        mod.visit(separator)

        def regenerate_mod(stmts):
            return cst.parse_module(cst.Module(body=stmts).code)

        def get_refs(mod):
            analyzer = AnalyzeCalls()
            cst.MetadataWrapper(mod).visit(analyzer)
            return [
                {'start': span.start, 'end': span.start + span.length, 'name': name}
                for (name, span) in analyzer.calls
            ]

        functions = {}
        main = regenerate_mod(separator.toplevel)
        functions['main'] = {
            'source': main.code,
            'refs': get_refs(main)
        }
        
        for func in separator.functions:
            mod = regenerate_mod([func])
            functions[func.name.value] = {
                'source': mod.code,
                'refs': get_refs(mod)
            }

        return {'functions': functions, 'call': call, 'answer': str(answer), 'N_var': N_var}

    def eval_trial(self, trial, result):
        return {
            "correct": 1 if trial["answer"] == result["response"] else 0,
            'telemetry': result['telemetry']
        }
