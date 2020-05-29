from collections import defaultdict
from pyro import distributions as dist
from torch import tensor, sigmoid
import torch
import pyro
import torch.distributions.constraints as constraints
from grammar import *

name_counters = defaultdict(int)
def reset_name_counters():
    global name_counters
    name_counters = defaultdict(int)

def sample_incr(name, dist):
    name_counters[name] += 1
    return pyro.sample(f'{name}{name_counters[name]:02d}', dist)

def sample(l, k):
    n = len(l)
    probs = sample_incr('sample', dist.Dirichlet(torch.ones(n)))
    idxs = torch.topk(probs, k).indices
    return [l[i] for i in idxs]

def choice(l):
    return sample(l, k=1)[0]

def guess():
    max_n = 9
    return choice(list(range(0, max_n+1)))

def flip(p):
    return sample_incr('flip', dist.Bernoulli(p)) == 1.

class Chunk:
    def __init__(self, value):
        self.value = value

class VarNameChunk(Chunk):
    pass

class VarValueChunk(Chunk):
    pass

class WorkingMemory:
    def __init__(self):
        self.chunks = []

    def store_var_val(self, var, val):
        assert isinstance(val, int)
        var_name = VarNameChunk(value=var)
        var_val = VarValueChunk(value=val)
        var_name.value_link = var_val
        var_val.var_link = var_name

        existing_binding = [
            chunk for chunk in self.chunks 
            if isinstance(chunk, VarNameChunk) and chunk.value == var
        ]
        if len(existing_binding) > 0:
            chunk = existing_binding[0]
            self.chunks.remove(chunk)
            if chunk.value_link in self.chunks:
                self.chunks.remove(chunk.value_link)

        self.store(var_name)
        self.store(var_val)
        
    def store_intermediate(self, value, tag=''):
        self.store_var_val(f'_intermediate_{tag}', value)

    def maybe_forget(self, prob_forget):
        did_forget = flip(prob_forget)
        if did_forget and len(self.chunks) > 0:
            probs = 1./tensor([ 1.3 ** j for j in range(len(self.chunks)) ])
            i = sample_incr('forget', dist.Dirichlet(probs)).argmax()
            del self.chunks[i]

    def maybe_swap(self, prob_swap):
        did_swap = flip(prob_swap)
        vrs = [chunk for chunk in self.chunks if isinstance(chunk, VarNameChunk)]
        if did_swap and len(vrs) >= 2:
            [x, y] = sample(vrs, k=2)
            tmp = x.value_link
            x.value_link = y.value_link
            y.value_link = tmp

    def store(self, chunk):
        self.chunks.append(chunk)
        
        num_chunks = len(self.chunks)
        if num_chunks > 7:
            prob_forget = sample_incr('prob_forget', dist.Beta((num_chunks - 7.9) * 15, 1))
            self.maybe_forget(prob_forget)

    def fetch_var(self, var):
        associated_val = [chunk.value_link for chunk in self.chunks if isinstance(chunk, VarNameChunk) and chunk.value == var]
        assert len(associated_val) <= 1
        if len(associated_val) > 0:
            val_chunk = associated_val[0]
            if val_chunk in self.chunks:
                return val_chunk.value

        return None

    def fetch_unassociated_val(self):
        unassociated_vals = [chunk for chunk in self.chunks if isinstance(chunk, VarValueChunk) and chunk.var_link not in self.chunks]
        if len(unassociated_vals) > 0:
            return choice(unassociated_vals).value

        return None

    def fetch_intermediate(self, tag=''):
        return self.fetch_var(f'_intermediate_{tag}')

    def decay(self):
        self.maybe_forget(0.05)
        self.maybe_swap(0.2)

def guess_behavior(wm):
    return guess()

def trace_expr(expr, wm, lookup_behavior=guess_behavior):
    if isinstance(expr, Number):
        return expr.n
    elif isinstance(expr, Var):
        val = wm.fetch_var(expr.var)
        return lookup_behavior() if val is None else val
    elif isinstance(expr, Binop):
        left = trace_expr(expr.left, wm)
        right = trace_expr(expr.right, wm)
        result = expr.operator.eval(left, right)
        return result
    else:
        raise Exception("Unreachable")

def trace_stmt(stmt, wm):
    if isinstance(stmt, Assign):
        val = trace_expr(stmt.value, wm)
        wm.decay()
        wm.store_var_val(stmt.var, val)
    elif isinstance(stmt, Expr):
        print(trace_expr(stmt.value, wm))
        
def trace(prog):
    wm = WorkingMemory()
    for stmt in prog.statements:
        trace_stmt(stmt, wm)


def sample_normal(name, params):
    return torch.max(
        sample_incr(name, dist.Normal(
            params[name]['mu'], params[name]['sigma'])),
        tensor(0.))

class TraceVisitor(NodeVisitor):
    def __init__(self, ctx, wm, params):
        self.ctx = ctx
        self.wm = wm
        self.tag = ['']
        self.time = tensor(0.)
        self.params = params
        
    def leave_Number(self, node):
        self.wm.store_intermediate(node.n, tag=self.tag[-1])
        self.time += sample_normal('number_cost', self.params)

    def _ctx_lookup(self, var):
        for i, stmt in reversed(list(enumerate(self.ctx))):
            if isinstance(stmt, Assign) and stmt.var == var:
                tracer = TraceVisitor(self.ctx[:i], self.wm, self.params)
                tracer.visit(stmt)
                self.time += tracer.time
                break

    def leave_Var(self, node):
        while True:
            val = self.wm.fetch_var(node.var)
            self.time += sample_normal('var_cost', self.params)
            if val is not None:
                self.wm.store_intermediate(val, tag=self.tag[-1])
                return
            self._ctx_lookup(node.var)
        
    def visit_Binop(self, node):
        while True:
            self.tag.append('left')
            self.visit(node.left)
            self.tag.pop()
            left = self.wm.fetch_intermediate('left')
            if left is None:
                continue

            self.tag.append('right')
            self.visit(node.right)
            self.tag.pop()
            right = self.wm.fetch_intermediate('right')
            if right is None:
                continue

            break

        n = node.operator.eval(left, right)
        self.wm.store_intermediate(n, tag=self.tag[-1])
        self.time += sample_normal('binop_cost', self.params)

        return False

    def leave_Assign(self, node):
        while True:
            intermediate = self.wm.fetch_intermediate()
            if intermediate is not None:            
                break
            self.visit(node.value)

        self.time += sample_normal('assign_cost', self.params)
        self.wm.store_var_val(node.var, intermediate)


params = {
    'number_cost': (0.2, 0.1),
    'var_cost': (0.2, 0.1),
    'binop_cost': (2.0, 1.0),
    'assign_cost': (0.2, 0.1)
}

def model(prog):
    reset_name_counters()

    param_values = {
        name: {
            'mu': pyro.param(f'{name}_mu', tensor(init_mu), constraint=constraints.positive),
            'sigma': pyro.param(f'{name}_sigma', tensor(init_sigma), constraint=constraints.positive)
        }
        for name, (init_mu, init_sigma) in params.items()
    }
    
    prog = parse(prog)
    wm = WorkingMemory()
    visitor = TraceVisitor(wm=wm, ctx=prog.statements[:-1], 
                           params=param_values)
    visitor.visit(prog.statements[-1])

    
    return visitor.time
