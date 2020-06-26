import React from 'react';

import {TrialStageProps, make_trial_generator, make_multiple_trials, ValueInput} from '../common';


interface TrialData {
  variables: {variable: string, expression: string, value: number}[]
  wait_time: number
}

let stage_generator = (i: number) => ({
  state: i + 1,
  view: (props: TrialStageProps<TrialData>) => {
    let trial = props.trial;
    let variable = trial.variables[i];

    let next_stage = (value: string) => {
      let response = parseInt(value);
      if (response == variable.value) {
        setTimeout(() => {
          props.next_stage();
        }, trial.wait_time);
      } else {
        props.trial_finished({
          response: {i: i, value: response}
        });
      }
    };

    return <div>
      <pre>{variable.variable} = {variable.expression}</pre>
      <ValueInput onEnter={(value) => next_stage(value)} />
    </div>;
  }
})

let TrialView = make_trial_generator<TrialData, number>(stage_generator, 0);
export let Experiment =
  make_multiple_trials<TrialData>(TrialView);
export let Explanation = (props: any) => <div />;