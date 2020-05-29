import React from 'react';

import {TrialStageProps, make_trial_sequence, make_multiple_trials, make_widget_view} from './common';

interface TrialData {
  variables: {variable: string, value: string}[]
  recall_variables: string[]
  presentation_time: number
}

export
let code_stage = (props: TrialStageProps<TrialData>) => {
  let trial = props.trial;
  let prog = trial.variables.map((v) => `${v.variable} = ${v.value}`).join('\n');
  setTimeout(() => { props.next_stage() }, trial.presentation_time);
  return <pre>{prog}</pre>;
}

let input_stage = (props: TrialStageProps<TrialData>) => {
  let trial = props.trial;
  let response: {[key:string]: string} = {};

  let trial_finished = () => {
    props.trial_finished({
      response: trial.recall_variables.map((v) => {
        return {variable: v, value: response[v]};
      })
    });
  };

  return <div>
    <div>
      {trial.recall_variables.map((v) =>
        <div>
          <pre style={{display: 'inline'}}>{v} = </pre>
          <input className='exp-input' type="text"
                 onChange={(e) => { response[v] = e.target.value; }} />
        </div>)}
    </div>
    <button onClick={trial_finished}>Next</button>
  </div>
}

let TrialView = make_trial_sequence([code_stage, input_stage]);
let VariableCuedRecallExperiment = make_multiple_trials<TrialData>(TrialView);

export
let VariableCuedRecallView = make_widget_view(VariableCuedRecallExperiment);
