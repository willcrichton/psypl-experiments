import React from 'react';

import {TrialStageProps, make_trial_sequence, make_multiple_trials} from './common';

interface TrialData {
  variables: {variable: string, value: string}[]
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
  let refs: {[v: string]: any} = {};
  trial.variables.forEach((v) => {
    refs[v.variable] = {variable: null, value: null};
  });

  let trial_finished = () => {
    props.trial_finished({
      response: trial.variables.map((v) => {
        let {variable, value} = refs[v.variable];
        return {variable: variable.value, value: value.value};
      })
    });
  };

  return <div>
    <div>
      {trial.variables.map((v) =>
        <div>
          <input className='exp-input' type="text" ref={(n) => refs[v.variable].variable = n} />
        &nbsp; = &nbsp;
        <input className='exp-input' type="text" ref={(n) => refs[v.variable].value = n} />
        </div>)}
    </div>
    <button onClick={trial_finished}>Next</button>
  </div>
}

let TrialView = make_trial_sequence([code_stage, input_stage]);
export let VariableMemoryExperiment = make_multiple_trials<TrialData>(TrialView);
