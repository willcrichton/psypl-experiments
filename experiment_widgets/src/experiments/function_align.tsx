import React from 'react';
import {AccumulatingSequence, SequenceChildProps} from 'react-sequence-typed';

import {TrialView, TrialData, sample_criterion} from './function_basic';
export {Experiment, TrialView} from './function_basic';
import {instruction_templates, TaskDescriptionProps, SampleTrial} from '../instructions';

let cond1_data: TrialData = {
  program: `def r(w, c, j, n):
  return j + c + w - n

r(3, 1, 5, 2)`,
  call: 'r(3, 1, 5, 2)',
  answer: 7
}

let cond2_data: TrialData = {
  program: `    t(2, 7, 6, 3)
def t(e, m, x, q):
  return m - e - q + x`,
  call: 't(2, 7, 6, 3)',
  answer: 6
}

let TaskDescription = (props: TaskDescriptionProps) =>
  <div>
    <p>This is an experiment to test your ability to mentally compute the result of a series of short Python programs. Your task is to compute the answer accurately, and as quickly as possible. Your time to answer will be measured.</p>

    <p>You will see two kinds of programs. The first contains a function followed by a function call. Your task is to compute the value of the function call.</p>

    <p><pre>{`def f(x, q, r):
  return r - x + q

f(8, 2, 9)`}</pre></p>

    <AccumulatingSequence>
      {({next}: SequenceChildProps) =>
        <SampleTrial TrialView={TrialView} on_finish={next} criterion={sample_criterion} trial_data={cond1_data} />}
      {(_: SequenceChildProps) =>
        <div>
          <p>The other kind of program is almost the same, except the function call is placed above the function, aligned with the definition. (This is not a technically valid program in that a function is being used before it's defined, but don't worry about that.)</p>
          <p><pre>{`    f(8, 2, 9)
def f(x, q, r):
  return r - x + q`}
          </pre></p>
          <SampleTrial TrialView={TrialView} on_finish={props.done} criterion={sample_criterion} trial_data={cond2_data} />
        </div>}
    </AccumulatingSequence>
  </div>;

let instructions = [
  <>{instruction_templates['no-tools']} {instruction_templates['no-scratch']}</>
];

export let instruction_params =
  {TaskDescription, instructions};
