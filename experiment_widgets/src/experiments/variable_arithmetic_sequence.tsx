import React, {useState} from 'react';
import {TrialStageProps, make_trial_generator, make_multiple_trials, ValueInput, SampleTrial, ProgressBar} from '../common';

interface TrialData {
  variables: {variable: string, expression: string, value: number}[]
  wait_time: number
}

enum StageState { Start, Correct, Incorrect }

let stage_generator = (i: number) => (props: TrialStageProps<TrialData, number>) => {
  let trial = props.trial;
  let variable = trial.variables[i];
  let [state, setState] = useState(StageState.Start);

  let next_stage = (value_str: string) => {
    let value = parseInt(value_str);
    if (value == variable.value) {
      setTimeout(() => {
        props.next_stage(i + 1);
      }, trial.wait_time);
      setState(StageState.Correct);
    } else {
      props.trial_finished({
        response: {i, value}
      });
      setState(StageState.Incorrect);
    }
  };

  let input_entered = state != StageState.Start;

  return <div>
    <pre>{variable.variable} = {variable.expression}</pre>
    <div style={{marginTop: '10px'}}>The value of <code>{variable.variable}</code> is:</div>
    <ValueInput onEnter={(value) => next_stage(value)} disabled={input_entered} />
    {input_entered
    ? <ProgressBar duration={trial.wait_time} />
    : null}
  </div>;
};

let TrialView = make_trial_generator<TrialData, number>(stage_generator, 0);
export let Experiment =
  make_multiple_trials<TrialData>(TrialView);

export let Explanation = (props: any) =>
  <div>
    <p>This is an experiment to test your ability to perform a sequence of mental arithmetic computations.</p>

    <p>Within a given trial, you will be presented with a sequence of variable assignments like <code>x = 1; t = x + 2; ...</code>. Your task is to respond with the value of the current variable, and to remember that value for use in remaining computations. The trial will continue until you provide an incorrect response.</p>

    <SampleTrial TrialView={TrialView} />

    <p>Once you understand the task, please read the following instructions.</p>

    <ul>
      <li>You will complete 20 trials.</li>
      <li>Trials are timed, so you must perform the experiment without a break.</li>
      <li>Please participate in an environment without distractions, either sounds or images.</li>
      <li>If you aren't sure of an answer, you should guess.</li>
      <li><strong>DO NOT</strong> use pen & paper, a digital notepad, or any other tool to help your memory during the experiment.</li>
    </ul>
  </div>;
