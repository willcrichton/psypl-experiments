import React, {useState} from 'react';
import {TrialStageProps, make_trial_generator, make_multiple_trials, ValueInput, ProgressBar} from '../common';
import {InstructionParams, instruction_templates} from '../instructions';

interface TrialData {
  variables: {variable: string, expression: string, value: number}[]
  wait_time: number
}

enum StageState { Start, Correct, Incorrect }

let stage_generator = (props: TrialStageProps<TrialData, number>) => {
  let i = props.state!;
  let trial = props.trial;
  let variable = trial.variables[i];
  let [state, setState] = useState(StageState.Start);

  let next_stage = (value_str: string) => {
    let value = parseInt(value_str);
    if (value == variable.value) {
      setTimeout(() => {
        if (i + 1 == trial.variables.length) {
          props.trial_finished({
            response: {i, value}
          });
        } else {
          props.next_stage(i + 1);
        }
      }, trial.wait_time);
      setState(StageState.Correct);
    } else {
      setTimeout(() => {
        props.trial_finished({
          response: {i, value}
        });
      }, trial.wait_time);
      setState(StageState.Incorrect);
    }
  };

  return <div>{
    state == StageState.Incorrect
    ? <span>That answer was incorrect. The correct answer was <code>{variable.variable} = {variable.value}</code>.</span>
    : <div>
      <pre>{variable.variable} = {variable.expression}</pre>
      <div style={{marginTop: '10px'}}>The value of <code>{variable.variable}</code> is:</div>
      <ValueInput onEnter={(value) => next_stage(value)} disabled={state == StageState.Correct} />
      {state == StageState.Correct
      ? <ProgressBar duration={trial.wait_time} />
      : null}
    </div>}
  </div>;
};

let TrialView = make_trial_generator<TrialData, number>(stage_generator, 0);
export let Experiment = make_multiple_trials<TrialData>(TrialView);

let TaskDescription = (props: any) =>
  <div>
    <p>This is an experiment to test your ability to perform a sequence of mental arithmetic computations.</p>

    <p>You will be presented with a sequence of variables assigned to arithmetic expressions like <code>x = 1; t = x + 2; ...</code>. For each variable assignment, your task is to respond with the value of the current variable, and to remember that value for use in remaining expressions. Press "Enter" to submit your answer.</p>

    <p>The sequence will continue until you provide an incorrect response. Then you will restart with a new sequence. Within a sequence, any previously assigned variable can be used in any future expression. However, variable assignments are not reused across sequences.</p>

    <p>Try out a sample trial. This trial will stop after three variables, but the real trials will continue indefinitely.</p>
  </div>;

let sample_data: TrialData = {
  variables: [
    {variable: 'x', expression: '1', value: 1},
    {variable: 'w', expression: 'x + 2', value: 3},
    {variable: 'u', expression: 'w - x', value: 2}
  ],
  wait_time: 2000
};

let sample_criterion = (trial: TrialData, response: any) => {
  return response.response.i == 2 && response.response.value == trial.variables[2].value;
};

let instructions = [
  <>{instruction_templates['no-tools']} {instruction_templates['no-scratch']}</>
];

export let instruction_params: InstructionParams =
  {TaskDescription, TrialView, sample_data, sample_criterion, instructions};
