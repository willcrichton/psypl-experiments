from pickle_cache import PickleCache
import pandas as pd
import json
import matplotlib.pyplot as plt 
import seaborn as sns
import string
import itertools
from random import randint, sample
from tqdm.auto import tqdm
from iterextras import par_for

sns.set()
pcache = PickleCache()
all_names = string.ascii_lowercase


def grid_search_kernel(args):
    (WorkingMemory, param_dict, N_trials, gt) = args
    sim = VariableSpanExperiment().simulate(lambda: WorkingMemory(**param_dict), N_trials=N_trials)
    loss = VariableSpanExperiment().simulation_loss(gt, sim)
    return {'loss': loss, **param_dict}
            

class VariableSpanExperiment:
    all_exp = [3, 4, 5, 6]

    def exp_name(self, N_var, N_trials):
        return f'varmem_{N_var}_{N_trials}'

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

    def process_results(self, N_var, N_trials):
        data = pcache.get(self.exp_name(N_var, N_trials))
        experiment = data['experiment']
        results = data['results']
        return self.eval_response(N_var, experiment, results)

    def results(self):
        return pd.concat([self.process_results(N_var, 10) for N_var in self.all_exp])

    def simulate_trial(self, variables, WorkingMemory):
        wm = WorkingMemory()
        for v in variables:
            wm.store(v['variable'], v['value'])

        response = []
        for v in variables:
            value = wm.load(v['variable'])
            if value is not None:
                response.append({'variable': v['variable'], 'value': value})

        return response

    def simulate_trials(self, N_var, N_trials, WorkingMemory):
        experiment = {
            'trials': [self.generate_trial(N_var) for _ in range(N_trials)]
        }

        response = [
            {'response': self.simulate_trial(trial['variables'], WorkingMemory)} 
            for trial in experiment['trials']
        ]

        return self.eval_response(N_var, experiment, response)

    def simulate(self, WorkingMemory, N_trials=1000):
        return pd.concat([self.simulate_trials(N_var, N_trials, WorkingMemory) for N_var in self.all_exp])

    def simulation_loss(self, gt, sim):
        def stats(series):
            g = series.groupby('N_var')
            return g.mean().correct, g.std().correct

        gt_mean, gt_std = stats(gt)
        sim_mean, sim_std = stats(sim)
        return ((gt_mean - sim_mean) ** 2).sum() + ((gt_std - sim_std) ** 2).sum()

    def grid_search(self, WorkingMemory, parameters, N_trials=300):
        gt = self.results()
        param_names = list(parameters.keys())
        param_values = list(parameters.values())
        inputs = [
            (WorkingMemory, {k: vals[i] for i, k in enumerate(param_names)}, N_trials, gt)
            for vals in itertools.product(*param_values)
        ]
        search_result = par_for(grid_search_kernel, inputs, process=True)
        search_result = pd.DataFrame(search_result)
        return search_result.iloc[search_result.loss.argmin()], search_result
        

def pymc3_example():
    import pymc3 as pm
    import theano.tensor as tt

    class Likelihood(tt.Op):
        itypes = [tt.dvector]
        otypes = [tt.dscalar]
        def perform(self, node, inputs, outputs):
            theta, = inputs
            sim = experiment.simulate(N_trials=100, WorkingMemory=lambda: BetaWM(alpha=theta[0], beta=theta[1]))
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
        sim = experiment.simulate(N_trials=100, WorkingMemory=lambda: BetaWM(alpha=theta[0], beta=theta[1]))
        return metric(sim)

    print(minimize(objective, np.array([2., -2.]), method='nelder-mead'))

