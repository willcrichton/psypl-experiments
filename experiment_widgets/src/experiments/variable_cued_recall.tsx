import React from 'react';

import {TrialSequenceProps, make_trial_sequence, make_multiple_trials, SampleTrial} from '../common';

interface TrialData {
  variables: {variable: string, value: string}[]
  recall_variables: string[]
  presentation_time: number
}

export
let code_stage = (props: TrialSequenceProps<TrialData>) => {
  let trial = props.trial;
  let prog = trial.variables.map((v) => `${v.variable} = ${v.value}`).join('\n');
  setTimeout(() => { props.next_stage() }, trial.presentation_time);
  return <pre>{prog}</pre>;
}

let input_stage = (props: TrialSequenceProps<TrialData>) => {
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
          <code>{v} = </code>
          <input className='exp-input' type="text"
                 onChange={(e) => { response[v] = e.target.value; }} />
        </div>)}
    </div>
    <button onClick={trial_finished}>Next</button>
  </div>
}

let TrialView = make_trial_sequence([code_stage, input_stage]);
export let Experiment = make_multiple_trials<TrialData>(TrialView);

export let Explanation = (props: any) =>
  <div>
    <p>This is an experiment to test your memory for variable/value pairs. You will be presented with a sequence of pairs like this:</p>

    <div className="indent"><pre>
      {`x = 4
q = 8
r = 2`}</pre></div>

    <p>Then you will be prompted with two randomly selected variables. Your task is to enter the corresponding number. In the above example, if prompted for <code>x</code>, you should enter <code>4</code>.</p>

    <SampleTrial TrialView={TrialView} />

    <p>Once you understand the task, please read the following instructions.</p>

    <ul>
      <li>You will complete 20 trials.</li>
      <li>Each trial may have a different number of variable pairs from the last one.</li>
      <li>Trials are timed, so you must perform the experiment without a break.</li>
      <li>Please participate in an environment without distractions, either sounds or images.</li>
      <li>If you aren't sure of an answer, you should guess.</li>
    </ul>
  </div>;
