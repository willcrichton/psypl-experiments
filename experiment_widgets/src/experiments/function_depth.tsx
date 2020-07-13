import React from 'react';
import {AccumulatingSequence, SequenceChildProps} from 'react-sequence-typed';

import {instruction_templates, TaskDescriptionProps, SampleTrial} from '../instructions';
import {TrialData, TrialView} from './function_basic';
export {Experiment} from './function_basic';


let cond1_data: TrialData = {
  program: '((1 - 3) + (8 + (9 - 2)))',
  call: undefined
};

let cond2_data: TrialData = {
  program: `f = 2 - 4
o = 1 + f
x = 8 - 9
p = x + o
`,
  call: 'p'
};

let cond3_data: TrialData = {
  program: `
def c():
  return 5 - 2
def u():
  return 3 + c()
def a():
  return 2 - 9
def t():
  return c() - a()
t()
`,
  call: 't()'
};

let sample_criterion = (trial: TrialData, response: any) => {
  return true;
};

export let TaskDescription = (props: TaskDescriptionProps) =>
  <div>
    <p>This is an experiment to test your ability to mentally compute the output of short Python programs. Your task is to compute the answer accurately, and as quickly as possible. Your time to answer will be measured.</p>

    <p>You will see three kinds of programs. The first is just an expression with numbers and arithmetic operations, like this:</p>

    <p><pre>((1 - (3 + 2)) + 4)</pre></p>

    <AccumulatingSequence>
      {({next}: SequenceChildProps) =>
        <div>
          <SampleTrial TrialView={TrialView} on_finish={next} criterion={sample_criterion}
                       trial_data={cond1_data} />
        </div>}
      {({next}: SequenceChildProps) =>
        <div>
          <p>The next kind of program is a straight-line sequence of variable assignments, like:</p>
          <p><pre>{`x = 3 + 2
y = 1 - x
z = y + 4`}
          </pre></p>
          <SampleTrial TrialView={TrialView} on_finish={next} criterion={sample_criterion}
                       trial_data={cond2_data} />
        </div>}
      {(_: SequenceChildProps) =>
        <div>
          <p>The last kind of program contains a sequence of function calls, for example:</p>
          <p><pre>{`def a():
  return 8 - 2
def r():
  return a() + 2
def g():
  return 1 - r()
g()`}
          </pre></p>
          <SampleTrial TrialView={TrialView} on_finish={props.done} criterion={sample_criterion}
                       trial_data={cond3_data} />
        </div>}
    </AccumulatingSequence>
  </div>;

let instructions = [
  <>{instruction_templates['no-tools']} {instruction_templates['no-scratch']}</>
];

export let instruction_params =
  {TaskDescription, instructions};
