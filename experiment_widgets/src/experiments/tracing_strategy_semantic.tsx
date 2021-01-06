import React from 'react';
import {Experiment, TrialView, TrialData} from './tracing_strategy';
import {instruction_templates, TaskDescriptionProps, SampleTrial} from '../instructions';
import {sample_criterion} from './function_basic';

export {Experiment} from './tracing_strategy';

let trial_data: TrialData = {
  'program': `def check_pangram(input_str):
    frequency = set()
    for alpha in input_str:
        if "a" <= alpha.lower() <= "z":
            frequency.add(alpha.lower())
    return True if len(frequency) == 26 else False`,
  'call': 'check_pangram("abcdefghijklmnop")',
  'answer': 'False'
}

let TaskDescription = (props: TaskDescriptionProps) =>
  <div>
    <p>This is an experiment to test your ability to mentally compute the output of short Python programs. Your task is to compute the answer accurately, and as quickly as possible. Your time to answer will be measured.</p>

    <p>These programs will be presented in an unfamiliar way. Each line of code will be blurred out. You must move your mouse over the line of code to see its contents. Try out a sample:</p>

    <SampleTrial TrialView={TrialView} on_finish={props.done} criterion={sample_criterion} trial_data={trial_data} />
  </div>;

let instructions = [
  <>{instruction_templates['no-tools']} {instruction_templates['no-scratch']}</>
];

export let instruction_params =
  {TaskDescription, instructions};
