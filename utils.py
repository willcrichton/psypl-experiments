from ipywidgets import Button, Text
from IPython.core.display import display, HTML, clear_output
from collections import namedtuple
from timeit import default_timer as now
from code_diff import Code

StageResult = namedtuple('StageResult', ['duration', 'output'])

def show_stages(stages, results, state={}):
    clear_output()

    if len(stages) == 0:
        results.append(state)
        return

    outp = None
    name, stage = stages[0]
    start = now()

    def cb(*args, **kwargs):
        state[name] = StageResult(now() - start, outp())
        return show_stages(stages[1:], results, state=state)

    outp = stage(cb) or (lambda: ())


def variable_test(expr):
    ctx_str, expr_str = expr.to_string()

    def setup_stage(cb):
        next_btn = Button(description='Next')

        display(Code(code=ctx_str))
        display(next_btn)

        next_btn.on_click(cb)

    def entry_stage(cb):
        entry = Text(placeholder='Answer here...')

        code = f'{ctx_str}\n\n{expr_str}'
        display(Code(code=code))
        display(HTML('Compute the value of the expression above.'))
        display(entry)

        entry.on_submit(cb)
        return lambda: entry.value

    return show_stages([('setup', setup_stage), ('guess', entry_stage)])


def fix_test(expr, results, infix=True):
    if infix:
        _, expr_string = expr.to_string()
    else:
        _, expr_string = expr.to_string_infix()

    def ready_stage(cb):
        next_btn = Button(description='Ready?')
        display(next_btn)
        next_btn.on_click(cb)

    def entry_stage(cb):
        entry = Text(placeholder='Answer here...')

        display(Code(code=expr_string))
        display(HTML('Compute the value of the expression above.'))
        display(entry)

        entry.on_submit(cb)
        return lambda: entry.value

    return show_stages(
        [('ready', ready_stage), ('guess', entry_stage)],
        results,
        state={'answer': expr.eval_expr()})
