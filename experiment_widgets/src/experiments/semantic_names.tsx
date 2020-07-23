import React from 'react';

import {make_multiple_trials} from '../common';
import {instruction_templates, TaskDescriptionProps, SampleTrial} from '../instructions';
import {TrialData, TrialView, sample_criterion} from './function_basic';

let TrialView2 = TrialView(180, 5);
export let Experiment = make_multiple_trials<TrialData>(TrialView2);

let data: TrialData = {
  program: `def mystery(l):
  if len(l) < 2:
    return l[0]
  else:
    return (l[0] + l[-1]) / 2.`,
  call: 'mystery([4, 2, 8, 10])',
  answer: '7'
};

let TaskDescription = (props: TaskDescriptionProps) =>
  <div>
    <p>This is an experiment to test your ability to mentally compute the output of short Python programs. Your task is to compute the answer accurately, and as quickly as possible. Your time to answer will be measured.</p>

    <p>You must perform all the work in your head. Do not use pen/paper or any other tool to help. You will have a maximum of 3 minutes per program to answer.</p>

    <p>You will not be told the purpose of the programs, but some programs may imlement familiar functions. Some programs will have meaningful English variable names, and some will have random single-letter variable names.</p>

    <div>
      <SampleTrial TrialView={TrialView2} on_finish={props.done} criterion={sample_criterion}
                   trial_data={data} />
    </div>
</div>;

let instructions = [
  <>{instruction_templates['no-tools']} {instruction_templates['no-scratch']}</>
];

export let instruction_params = {TaskDescription, instructions};
