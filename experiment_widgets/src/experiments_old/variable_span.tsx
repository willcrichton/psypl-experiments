import React from 'react';

import {TrialSequenceProps, make_trial_sequence, make_multiple_trials} from '../common';

interface TrialData {
  variables: {variable: string, value: string}[]
  presentation_time: number
}

export let code_stage = (props: TrialSequenceProps<TrialData>) => {
  let trial = props.trial;
  let prog = trial.variables.map((v) => `${v.variable} = ${v.value}`).join('\n');
  setTimeout(() => { props.next_stage() }, trial.presentation_time);
  return <pre>{prog}</pre>;
}

let input_stage = (props: TrialSequenceProps<TrialData>) => {
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
          <span style={{margin: '0 10px'}}>=</span>
          <input className='exp-input' type="text" ref={(n) => refs[v.variable].value = n} />
        </div>)}
    </div>
    <button onClick={trial_finished}>Next</button>
  </div>
}

export let TrialView = make_trial_sequence([code_stage, input_stage]);
export let Experiment = make_multiple_trials<TrialData>(TrialView);

export let Explanation = (props: any) =>
  <div>
    <p>This is an experiment to test your memory for variable/value pairs. For several seconds, you will be presented with a sequence of pairs like this:</p>

    <div className="indent"><pre>
      {`x = 4
q = 8
r = 2`}</pre></div>

    <p>Then the code will disappear. Your task is to enter as many variable/value pairs as you remember.</p>
  </div>;
