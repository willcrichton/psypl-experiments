from ..base import Experiment
from ..utils import (all_names, sample, shuffle)
from enum import Enum
import experiment_widgets
import os
import libcst as cst
from libcst.metadata import ScopeProvider
import libcst.matchers as m
import json

SNIPPET_DIR = os.path.join(os.path.dirname(__file__), '../../data/snippets')
SNIPPETS = {
    os.path.splitext(f)[0]: cst.parse_module(open(f'{SNIPPET_DIR}/{f}').read())
    for f in os.listdir(SNIPPET_DIR)
} 

class Preprocessor(cst.CSTTransformer):
    def leave_FunctionDef(self, _, new_node):
        new_node = new_node.with_changes(name=cst.Name(value='mystery'))
        new_node = new_node.with_deep_changes(new_node.body, body=new_node.body.body[1:])
        return new_node

    def leave_Module(self, _, new_node):
        return new_node.with_changes(header=[])

class RandomRenamer(cst.CSTTransformer):
    METADATA_DEPENDENCIES = (ScopeProvider, )
    
    def __init__(self):
        self.var_map = {}
        self.random_names = sample(all_names, k=len(all_names))
        self.random_idx = 0
        
    def new_name(self):
        name = self.random_names[self.random_idx]
        self.random_idx += 1
        return name        
    
    def visit_FunctionDef(self, node):
        scope = self.get_metadata(ScopeProvider, node.body)
        
        for param in node.params.params:
            self.var_map[param.name.value] = self.new_name()

        for a in scope.assignments:
            if m.matches(a.node, m.Name()):
                self.var_map[a.node.value] = self.new_name()
                
    def leave_Name(self, old_node, new_node):
        if old_node.value in self.var_map:
            return cst.Name(value=self.var_map[old_node.value])
        return new_node
    
    def leave_Expr(self, old_node, new_node):
        if m.matches(old_node, m.Expr(m.SimpleString())):
            return cst.RemovalSentinel.REMOVE
        return new_node
        

class SemanticNamesExperiment(Experiment):
    Widget = experiment_widgets.FunctionBasicExperiment

    class Condition(Enum):
        Normal = 1
        Random = 2
    
    def generate_experiment(self, N_trials=6):        
        all_snippets = list(SNIPPETS.values())
        filtered_snippets = []
        for snippet in all_snippets:
            metadata = json.loads(snippet.header[0].comment.value[1:])
            if 'skip' in metadata:
                continue
            filtered_snippets.append(snippet)
        print(len(filtered_snippets))

        snippets = sample(filtered_snippets, k=N_trials)
        conds = [self.Condition.Normal for _ in range(N_trials // 2)] + [self.Condition.Random for _ in range(N_trials // 2)]
        return {
            'trials': shuffle([
                self.generate_trial(snippet, cond)
                for cond, snippet in zip(conds, snippets)
            ]),
            'between_trials_time': 5000
        }

    def eval_trial(self, trial, result):
        correct = result['response'].lower() == trial['answer'].lower()
        return {
            'function': trial['function'],
            'correct': 1 if correct else 0,
            'answer': result['response'],
            'cond': trial['cond']
        }
    
    def generate_trial(self, program, cond):
        metadata = json.loads(program.header[0].comment.value[1:])
        name = program.body[0].name.value

        program = cst.MetadataWrapper(program).visit(Preprocessor())

        if cond == self.Condition.Random:
            program = cst.MetadataWrapper(program).visit(RandomRenamer())
 
        call = f'mystery({metadata["input"]})'

        globls = {}
        exec(program.code, globls, globls)
        answer = eval(call, globls, globls)

        return {
            'program': program.code,
            'call': call,
            'function': name,
            'cond': str(cond),
            'answer': str(answer),
            'schema': metadata['schema']
        }
