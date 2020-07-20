import React from 'react';
import {AccumulatingSequence, SequenceChildProps} from 'react-sequence-typed';

import {instruction_templates, TaskDescriptionProps, SampleTrial} from '../instructions';
import {TrialData, TrialView, sample_criterion} from './function_basic';
export {Experiment} from './function_basic';


let cond1_data: TrialData = {
  program: '((1 - 3) + (8 + (9 - 2)))',
  call: undefined,
  answer: 13
};

let cond2_data: TrialData = {
  program: `f = 2 - 4
o = 1 + f
x = 8 - 9
p = x + o
`,
  call: 'p',
  answer: -2
};

let cond3_data: TrialData = {
  program: `def c():
  return 5 - 2
def u():
  return 3 + c()
def a():
  return 2 - 8
def t():
  return c() - a()
t()`,
  call: 't()',
  answer: 9
};

let TaskDescription = (props: TaskDescriptionProps) =>
  <div>
    <p>This is an experiment to test your ability to mentally compute the output of short Python programs. Your task is to compute the answer accurately, and as quickly as possible. Your time to answer will be measured.</p>

    <p>You will see three kinds of programs. The first is just an expression with numbers and arithmetic operations, like this:</p>

    <p><pre>((1 - (3 + 2)) + 4)</pre></p>

    <p>Your job is to compute the numeric value of the expression using only your brain (no calculator, pencil, etc.). For example, the expression above has a value of 0.</p>

    <p>Then type the answer into the provided input box. Negative numbers should be written like "-5" with a minus sign in front. Once you're done, press "Enter".</p>

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
z = y + 4
z`}
          </pre></p>
          <SampleTrial TrialView={TrialView} on_finish={next} criterion={sample_criterion}
                       trial_data={cond2_data} />
        </div>}
      {(_: SequenceChildProps) =>
        <div>
          <p>The last kind of program contains a sequence of function calls, for example:</p>
          <p><pre>{`def x():
  return 3 + 2
def y():
  return 1 - x()
def z():
  return y() + 4
z()`}
          </pre></p>
          <SampleTrial TrialView={TrialView} on_finish={props.done} criterion={sample_criterion}
                       trial_data={cond3_data} />
        </div>}
    </AccumulatingSequence>
  </div>;

let instructions = [
  <>{instruction_templates['no-tools']} {instruction_templates['no-scratch']}</>
];

export let instruction_params = {TaskDescription, instructions};
