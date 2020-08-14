import React from 'react';

import {instruction_templates, TaskDescriptionProps, SampleTrial} from '../instructions';
import {TrialView, TrialData, sample_criterion} from './function_basic';
export {Experiment, TrialView} from './function_basic';

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
    <p>TODO</p>
  </div>;

let instructions = [
  <>{instruction_templates['no-tools']} {instruction_templates['no-scratch']}</>
];

export let instruction_params =
  {TaskDescription, instructions};
