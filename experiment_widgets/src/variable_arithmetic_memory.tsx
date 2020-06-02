import React from 'react';

import {TrialStageProps, make_trial_sequence, make_multiple_trials} from './common';

import {code_stage} from './variable_memory';

interface TrialData {
  variables: {variable: string, value: string}[]
  expression: string
  presentation_time: number
}

let input_stage = (props: TrialStageProps<TrialData>) => {
  let trial = props.trial;
  let ref = React.createRef<HTMLInputElement>();

  let trial_finished = () => {
    props.trial_finished({
      response: ref.current!.value
    });
  };

  return <div>
    <pre>{trial.expression}</pre>
    <input type="text" className="exp-input" ref={ref} />
    <button onClick={trial_finished}>Next</button>
  </div>;
};

let TrialView = make_trial_sequence([code_stage, input_stage]);
export let VariableArithmeticMemoryExperiment =
  make_multiple_trials<TrialData>(TrialView);
