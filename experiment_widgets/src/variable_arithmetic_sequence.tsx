import React from 'react';

import {TrialStageProps, make_trial_generator, make_multiple_trials, make_widget_view} from './common';


interface TrialData {
  variables: {variable: string, expression: string, value: number}[]
  wait_time: number
}

let stage_generator = (i: number) => ({
  state: i + 1,
  view: (props: TrialStageProps<TrialData>) => {
    let trial = props.trial;
    let variable = trial.variables[i];
    let ref = React.createRef<HTMLInputElement>();

    let next_stage = () => {
      let response = parseInt(ref.current!.value);
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
      <input type="text" className="exp-input" ref={ref} />
      <button onClick={next_stage}>Next</button>
    </div>;
  }
})

let TrialView = make_trial_generator<TrialData, number>(stage_generator, 0);
let VariableArithmeticSequenceExperiment =
  make_multiple_trials<TrialData>(TrialView);

export
let VariableArithmeticSequenceView =
  make_widget_view(VariableArithmeticSequenceExperiment);
