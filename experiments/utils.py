from pickle_cache import PickleCache
import pandas as pd
import json
import matplotlib.pyplot as plt 
import seaborn as sns
import string
import itertools
from random import randint, sample
from tqdm.auto import tqdm
from iterextras import par_for, unzip
import hyperopt
from grammar import *
from random import choice, choices
import numpy as np
from scipy.stats import wasserstein_distance
import experiment_widgets

sns.set()
pcache = PickleCache()
all_names = string.ascii_lowercase
all_operators = ['+', '-']

def earth_movers(p, q):
    
    # TODO: what is the right distance?
    k = max(len(p), len(q))
    p = np.pad(p, (0, k-len(p)), mode='constant')
    q = np.pad(q, (0, k-len(q)), mode='constant')
    dist = np.zeros((k, k))
    for i in range(k):
        for j in range(0, i):
            d = ((i + 1) - (j + 1)) * 0.25
            dist[((i, j), (j, i))] = d

    return pyemd.emd(p, q, dist)

def grid_search_kernel(args):
    (WorkingMemory, param_dict, N_trials, gt) = args
    sim = VariableSpanExperiment().simulate(lambda: WorkingMemory(**param_dict), N_trials=N_trials)
    loss = VariableSpanExperiment().simulation_loss(gt, sim)
    return {'loss': loss, **param_dict}

class Experiment:
    def exp_name(self, N_var, N_trials):
        raise NotImplementedError

    def eval_response(self, N_var, experiment, results):
        raise NotImplementedError
        
    def process_results(self, N_var, N_trials, **kwargs):
        data = pcache.get(self.exp_name(N_var, N_trials, **kwargs))
        experiment = data['experiment']
        results = data['results']
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
            sim = self.simulate(
                N_trials=N_trials, model=lambda: model(**kwargs))
            return self.simulation_loss(gt, sim)

        trials = hyperopt.Trials()
        best_params = hyperopt.fmin(
            objective, space, algo=hyperopt.tpe.suggest, timeout=timeout, 
            trials=trials, **kwargs)
        all_params = pd.DataFrame([
            {**{
                k: v[0] for k,v in trial['misc']['vals'].items()
            }, 'loss': trial['result']['loss']}
            for trial in trials.trials
        ])
        return best_params, all_params
    
    def grid_search(self, model, parameters, N_trials=300):
        gt = self.results()
        param_names = list(parameters.keys())
        param_values = list(parameters.values())
        inputs = [
            (model, {k: vals[i] for i, k in enumerate(param_names)}, N_trials, gt)
            for vals in itertools.product(*param_values)
        ]
        search_result = par_for(grid_search_kernel, inputs, process=True)
        search_result = pd.DataFrame(search_result)
        return search_result.iloc[search_result.loss.argmin()], search_result


    def simulate_trials(self, N_var, N_trials, model):
        experiment = self.generate_experiment(N_var, N_trials)

        response = [
            {'response': self.simulate_trial(trial, model)} 
            for trial in experiment['trials']
        ]

        return self.eval_response(N_var, experiment, response, participant='simulation')

    def simulate(self, model, N_trials=1000):
        return pd.concat([
            self.simulate_trials(N_var, N_trials, model) 
            for N_var in self.all_exp
        ])


class VariableSpanExperiment(Experiment):
    all_exp = [3, 4, 5, 6]

    def exp_name(self, N_var, N_trials):
        return f'varmem_{N_var}_{N_trials}'

    def generate_experiment(self, N_var, N_trials=10):
        return {
            'trials': [self.generate_trial(N_var) for _ in range(N_trials)]
        }

    def generate_trial(self, N):
        names = sample(all_names, k=N)
        return {'variables': [
            {'variable': names[i], 'value': randint(0, 9)}
            for i in range(N)
        ], 'presentation_time': N * 1500}

    def eval_response(self, N_var, experiment, results):
        df = []
        for i, (trial, result) in enumerate(zip(experiment['trials'], results)):
            correct = 0
            badvalue = 0
            badname = 0
            for j, var in enumerate(trial['variables']):
                category = None
                for var2 in result['response']:
                    if var['variable'] == var2['variable']:
                        if var['value'] == int(var2['value']):
                            correct += 1
                        else:
                            badvalue += 1
                        break
                else:
                    badname += 1

            df.append({
                'N_var': N_var,
                'correct': correct,
                'badvalue': badvalue,
                'badname': badname
            })

        return pd.DataFrame(df)  

    def simulate_trial(self, trial, model):
        wm = model()
        for v in trial['variables']:
            wm.store(v['variable'], v['value'])

        response = []
        for v in trial['variables']:
            value = wm.load(v['variable'])
            if value is not None:
                response.append({'variable': v['variable'], 'value': value})

        return response

    def simulation_loss(self, gt, sim):
        def dists(df):
            return [
                df[df.N_var == N_var].correct.tolist()
                for N_var in sorted(df.N_var.unique())
            ]

        return sum([
            wasserstein_distance(gt_dist, sim_dist)
            for gt_dist, sim_dist in zip(dists(gt), dists(sim))
        ])

    # deprecated
    def _summary_stats_simulation_loss(self, gt, sim):
        def stats(series):
            series.groupby('N_var', 'correct').sum()
            g.sum()
            return g.mean().correct, g.std().correct

        gt_mean, gt_std = stats(gt)
        sim_mean, sim_std = stats(sim)
        return ((gt_mean - sim_mean) ** 2).sum() + ((gt_std - sim_std) ** 2).sum()

class VariableCuedRecallExperiment(Experiment):
    all_exp = [3, 4, 5, 6]
    all_participants = ['will']
    num_to_recall = 2
    num_trials = 20

    def exp_name(self, N_var, N_trials, participant):
        return f'cuedrecall2_{participant}_{N_var}_{N_trials}'

    def results(self):
        return pd.concat([self.process_results(N_var, self.num_trials, participant=participant) for participant in self.all_participants for N_var in self.all_exp])

    def generate_trial(self, N):
        names = sample(all_names, k=N)
        return {
            'variables': [
                {'variable': names[i], 
                 'value': randint(0, 9)}
                for i in range(N)
            ], 
            'recall_variables': sample(names, k=self.num_to_recall),
            'presentation_time': N * 1500
        }

    def eval_response(self, N_var, experiment, results, participant):
        df = []
        for (trial, result) in zip(experiment['trials'], results):
            gt = {v['variable']: v['value'] for v in trial['variables']}
            var_idx = {v['variable']: i for i, v in enumerate(trial['variables'])}
            total = 0
            for response in result['response']:
                correct = 'value' in response and gt[response['variable']] == int(response['value'])
                df.append({
                    'correct': 1 if correct else 0,
                    'var_idx': var_idx[response['variable']],
                    'N_var': N_var,
                    'participant': participant
                })

        return pd.DataFrame(df)

    def generate_experiment(self, N_var, N_trials):
        return {
            'trials': [self.generate_trial(N_var) for _ in range(N_trials)],
            'between_trials_time': 2000
        }

    def run_experiment(self, participant, N_var, N_trials=20, dummy=False):
        exp_desc = self.generate_experiment(N_var=N_var, N_trials=N_trials)
        exp = experiment_widgets.VariableCuedRecallExperiment(
            experiment=json.dumps(exp_desc),
            results='[]')
        
        def on_result_change(_):
            if not dummy:
                pcache.set(self.exp_name(N_var, N_trials, participant), {
                    'experiment': exp_desc,
                    'results': json.loads(exp.results)
                })

        exp.observe(on_result_change)
        return exp

    def simulate_trial(self, trial, model):
        wm = model()
        for v in trial['variables']:
            wm.store(v['variable'], v['value'])
        values = [v['value'] for v in trial['variables']]

        response = []
        for v in trial['recall_variables']:
            value = wm.load(v) 
            if value is None:
                value = choice(values)
            response.append({'variable': v, 'value': value})

        return response

    def simulation_loss(self, gt, sim):
        def dists(df):
            return [
                df[df.N_var == N_var].correct.tolist()
                for N_var in sorted(df.N_var.unique())
            ]

        return sum([
            wasserstein_distance(gt_dist, sim_dist)
            for gt_dist, sim_dist in zip(dists(gt), dists(sim))
        ])

class VariableArithmeticExperiment(Experiment):
    all_exp = [2, 3, 4, 5]

    def exp_name(self, N_var, N_trials):
        return f'vararithmem_{N_var}_{N_trials}'    

    def eval_response(self, N_var, experiment, results, participant=None):
        rows = []
        for (trial, result) in zip(experiment['trials'], results):
            try:
                response = int(result['response'])
            except ValueError:
                continue

            rows.append({
                'N_var': N_var, 
                'correct': 1 if trial['expression_value'] == response else 0
            })

        return pd.DataFrame(rows)

    def generate_trial(self, N):
        names = sample(all_names, k=N)
        variables = [
            {'variable': names[i], 'value': randint(1, 9)}
            for i in range(N)
        ]

        expr_var_order = sample(variables, k=len(variables))
        operators = choices(all_operators, k=N-1)
        expr_list = []
        expr_value = expr_var_order[0]['value']
        for i in range(N):
            if i > 0:
                op = operators[i-1]
                expr_value = eval(f"{expr_value} {op} {expr_var_order[i]['value']}")
                expr_list.append(op)
            expr_list.append(expr_var_order[i]['variable'])
        expr = ' '.join(expr_list)

        return {
            'variables': variables, 
            'expression': expr,
            'expression_value': expr_value,
            'presentation_time': 500 + N * 1500
        }

    def simulate_trial(self, trial, model):
        wm = model()

        for var in trial['variables']:
            wm.store(var['variable'], var['value'])

        expr = parse(trial['expression']).statements[0].value
        return wm.trace_expr(expr)

class VariableSequenceExperiment(Experiment):
    all_exp = [0]

    def exp_name(self, N_var, N_trials):
        return f'vararithseq_{N_trials}'

    def generate_expression(self, variables):
        if len(variables) == 0:
            value = randint(1, 9)
            return str(value), value
        elif len(variables) == 1:
            rhs = randint(1, 9)
            op = choice(all_operators)
            expression = f"{variables[0]['variable']} {op} {rhs}"
            value = eval(f"{variables[0]['value']} {op} {rhs}")
            return expression, value
        else:
            [lhs, rhs] = sample(variables, k=2)
            op = choice(all_operators)
            expression = f"{lhs['variable']} {op} {rhs['variable']}"
            value = eval(f"{lhs['value']} {op} {rhs['value']}")
            return expression, value

    def generate_trial(self, _):
        K = 10
        names = sample(all_names, k=K)
        variables = []
        for i in range(K):
            expression, value = self.generate_expression(variables)
            variables.append({
                'variable': names[i],
                'expression': expression,
                'value': value
            })

        return {
            'variables': variables, 
            'wait_time': 1000
        }

    def analyze_error(self, variables, expression, guess):
        possible_values = [v['value'] for v in variables]
        ast = parse(expression).statements[0].value
        if len(variables) == 0:
            return 'calculation'

        op = ast.operator
        for (a, b) in itertools.permutations(possible_values, 2):
            if op.eval(a, b) == guess:
                return 'substitution'
        return 'calculation'

    def eval_response(self, N_var, experiment, results):
        df = []    
        for (trial, result) in zip(experiment['trials'], results):
            result = result['response']
            variables = trial['variables']
            i = result['i']
            error = self.analyze_error(
                variables[:i], variables[i]['expression'], result['value'])
            df.append({
                'stage': i,
                'error': error 
            })
        return pd.DataFrame(df)

    def simulate_trial(self, trial, model):
        wm = model()

        for i, var in enumerate(trial['variables']):
            name = var['variable']
            stmt = parse(f"{name} = {var['expression']}").statements[0]
            wm.trace_stmt(stmt)        
            response = wm.load(name)
            response = response if response is not None else randint(1,9)
            if response != var['value']:
                return {
                    'i': i,
                    'value': response
                }

        return {'i': i, 'value': 0}      

    def simulation_loss(self, gt, sim):
        def dists(df):
            return [
                df[df.error == error].stage.tolist()
                for error in sorted(df.error.unique())
            ]

        def stats2(df):
            counts = df.groupby('error').size() / len(df)
            return counts.values.tolist()[0]

        mse_group_proportion = (stats2(gt) - stats2(sim)) ** 2

        return sum([
            wasserstein_distance(gt_dist, sim_dist)
            for (gt_dist, sim_dist) in zip(dists(gt), dists(sim))
        ]) + mse_group_proportion*10

    

def pymc3_example():
    import pymc3 as pm
    import theano.tensor as tt

    class Likelihood(tt.Op):
        itypes = [tt.dvector]
        otypes = [tt.dscalar]
        def perform(self, node, inputs, outputs):
            theta, = inputs
            sim = experiment.simulate(N_trials=100, model=lambda: BetaWM(alpha=theta[0], beta=theta[1]))
            outputs[0][0] = np.array(-np.log(metric(sim)))

    likelihood = Likelihood()

    with pm.Model() as model:
        alpha = pm.Uniform('alpha', lower=0., upper=10.)
        beta = pm.Uniform('beta', lower=-10., upper=0.)
        pm.DensityDist('likelihood', lambda theta: likelihood(theta), 
                       observed={'theta': tt.as_tensor_variable([alpha, beta])})
        trace = pm.sample(30, cores=8)

    pm.traceplot(trace)
    sns.kdeplot(trace['alpha'], trace['beta'])

def scipy_example():
    from scipy.optimize import minimize

    def objective(theta):
        sim = experiment.simulate(N_trials=100, model=lambda: BetaWM(alpha=theta[0], beta=theta[1]))
        return metric(sim)

    print(minimize(objective, np.array([2., -2.]), method='nelder-mead'))



"""
class VariableChunk: pass
class ValueChunk: pass

class SepChunkWM(BetaWM):
    def store(self, variable, value):
        variable_chunk = VariableChunk()
        value_chunk = ValueChunk()
        variable_chunk.variable = variable
        variable_chunk.value = value_chunk
        value_chunk.value = value
        value_chunk.variable = variable_chunk
        self.chunks.append(variable_chunk)
        self.chunks.append(value_chunk)        

        self.maybe_forget()

    def load(self, variable):
        for chunk in self.chunks:
            if isinstance(chunk, VariableChunk) and chunk.variable == variable:
                if chunk.value in self.chunks:
                    return chunk.value.value
                unassoc_chunks = [chunk for chunk in self.chunks \
                                  if isinstance(chunk, ValueChunk) and chunk.variable not in self.chunks]
                if len(unassoc_chunks) > 0:
                    return choice(unassoc_chunks).value
        return None


class TraceIntermediateWM(SwapWM):
    def trace_expr(self, expr):
        if isinstance(expr, Number):
            return expr.n
        elif isinstance(expr, Var):
            val = self.load(expr.var)
            if val is not None:
                return val
            else:
                return randint(1, 9)
        elif isinstance(expr, Binop):
            left = self.trace_expr(expr.left)
            right = self.trace_expr(expr.right)
            result = expr.operator.eval(left, right)
            return result
        else:
            raise Exception("Unreachable")
"""
