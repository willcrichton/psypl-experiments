import React from 'react';

import {TrialStageProps, make_trial_sequence, make_multiple_trials} from './common';

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
export let VariableCuedRecallExperiment = make_multiple_trials<TrialData>(TrialView);

class SampleTrial extends React.Component {
  state = {playing: false}

  render() {
    let sample_trial = {
      variables: [
        {variable: 'q', value: '3'},
        {variable: 'f', value: '2'},
        {variable: 'e', value: '8'}
      ],
      recall_variables: ['e', 'q'],
      presentation_time: 4500
    };

    return this.state.playing
      ? <TrialView trial={sample_trial} finished={() => {this.setState({playing: false})}} />
      : <button onClick={() => {this.setState({playing: true})}}>Click here to try a sample task</button>;
  }
}

export let Explanation = (props: any) => {
  return <div>
    <p>This is an experiment to test your memory for lists of letters and numbers. You will be presented with letter/number pairs like this:</p>

    <pre>
{`x = 4
q = 8
r = 2`}</pre>

    <p>Then you will be prompted with two randomly selected letters. Your goal is to enter the paired numbers. In the above example, if prompted for <code>x</code>, you should enter <code>4</code>.</p>

    <SampleTrial />

    <p>Each trial may have a different number of letter/number pairs from the last one. You will complete 20 trials. Once you're ready, click the button below to start the experiment.</p>

    <p><button onClick={props.start}>Start the experiment</button></p>
  </div>;
};
