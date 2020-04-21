from pyro import sample, distributions as dist
from torch import tensor, sigmoid
from lark import Lark, Token
from dataclasses import dataclass
from enum import Enum
from typing import List, Any

def choice(l):
    n = len(l)
    return l[dist.Categorical(tensor([1. / n for _ in range(n)])).sample().item()]

def guess():
    max_n = 9
    return choice(list(range(0, max_n+1)))


@dataclass
class Chunk:
    value: Any

@dataclass
class VarNameChunk(Chunk):
    value_link: Chunk

@dataclass
class VarValueChunk(Chunk):
    var_link: Chunk
                

class WorkingMemory:
    def __init__(self):
        self.chunks = []

    def store_var_val(self, var, val):
        var_name = VarNameChunk(value=var, value_link=None)
        var_val = VarValueChunk(value=val, var_link=None)
        var_name.value_link = var_val
        var_val.var_link = var_name
        self.store(var_name)
        self.store(var_val)

    def store(self, chunk):
        self.chunks.append(chunk)
        
        num_chunks = len(self.chunks)
        if num_chunks > 7:
            prob_forget = dist.Beta((num_chunks - 7.9) * 15, 1).sample()
            did_forget = dist.Bernoulli(prob_forget).sample()
            
            if did_forget.item() == 1:
                i = choice(list(range(num_chunks)))
                del self.chunks[i]

    def fetch_var(self, var):
        for chunk in self.chunks:
            if isinstance(chunk, VarNameChunk) and chunk.value == var:
                val_chunk = chunk.value_link
                if val_chunk in self.chunks:
                    return val_chunk.value

        return None

class ASTNode:
    pass

@dataclass
class Number(ASTNode):
    n: int
        
@dataclass        
class Var(ASTNode):        
    var: str
        
class BinaryOperator(Enum):        
    Add = 1
    Sub = 2

    def eval(self, left, right):
        if self == BinaryOperator.Add:
            return left + right
        elif self == BinaryOperator.Sub:
            return left - right
        
    
@dataclass
class Binop(ASTNode):
    operator: BinaryOperator
    left: ASTNode
    right: ASTNode
    
@dataclass
class Assign(ASTNode):
    var: str
    value: ASTNode
        
@dataclass
class Expr(ASTNode):
    value: ASTNode
        
@dataclass
class Program(ASTNode):
    statements: List[ASTNode]

parser = Lark('''
%import common.NUMBER 
%import common.WS
%import common.CNAME
%ignore WS

var: CNAME
binop: "+" -> plus | "-" -> sub
  
expr: atom -> atom
  | expr binop atom -> binop

atom: CNAME -> var
  | NUMBER -> number

stmt: CNAME "=" expr -> assign 
  | expr -> expr
  
prog: stmt*
''', start='prog')

def lark_tree_to_ast(t):
    if isinstance(t, Token):
        return t.value
    
    c = list(map(lark_tree_to_ast, t.children))
    return {
        'plus': lambda: BinaryOperator.Add,
        'sub': lambda: BinaryOperator.Sub,
        'prog': lambda: Program(c),
        'assign': lambda: Assign(var=c[0], value=c[1]),
        'binop': lambda: Binop(left=c[0], operator=c[1], right=c[2]),
        'expr': lambda: Expr(value=c[0]),
        'var': lambda: Var(var=c[0]),
        'number': lambda: Number(n=int(c[0])),
        'atom': lambda: c[0]
    }[t.data]()

def parse(s):
    return lark_tree_to_ast(parser.parse(s))

def trace_expr(expr, wm):
    if isinstance(expr, Number):
        return expr.n
    elif isinstance(expr, Var):
        val = wm.fetch_var(expr.var)
        return guess() if val is None else val
    elif isinstance(expr, Binop):
        left = trace_expr(expr.left, wm)
        right = trace_expr(expr.right, wm)
        return expr.operator.eval(left, right)
    else:
        raise Exception("Unreachable")

def trace_stmt(stmt, wm):
    if isinstance(stmt, Assign):
        wm.store_var_val(stmt.var, trace_expr(stmt.value, wm))
    elif isinstance(stmt, Expr):
        print(trace_expr(stmt.value, wm))
        
def trace(prog):
    wm = WorkingMemory()
    for stmt in prog.statements:
        trace_stmt(stmt, wm)
    
