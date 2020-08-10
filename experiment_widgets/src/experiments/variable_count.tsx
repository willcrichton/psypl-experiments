import React from 'react';

import {TrialView, TrialData, sample_criterion} from './function_basic';
export {Experiment, TrialView} from './function_basic';
import {instruction_templates, TaskDescriptionProps, SampleTrial} from '../instructions';

let TrialView2 = TrialView(90, 2);

let data: TrialData = {
  program: `m = (8 - (5 + 6))
f = (7 - (9 + 7))
((5 - m) - f)`,
  call: '((5 - m) - f)',
  answer: '17'
};

let TaskDescription = (props: TaskDescriptionProps) =>
  <div>
    <p>This is an experiment to test your ability to mentally compute the result of a series of short programs. Your task is to compute the answer accurately, and as quickly as possible. Your time to answer will be measured.</p>

    <p>Each program is a list of variables assigned to numeric expressions. You must compute the value in your head, without using pen/paper. Try out a sample trial:</p>

    <SampleTrial TrialView={TrialView2} on_finish={props.done} criterion={sample_criterion} trial_data={data} />
  </div>;

let instructions = [
  <>{instruction_templates['no-tools']} {instruction_templates['no-scratch']}</>
];

export let instruction_params =
  {TaskDescription, instructions};
