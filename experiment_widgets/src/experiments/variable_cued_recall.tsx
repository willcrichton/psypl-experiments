import React, {useEffect} from 'react';
import _ from 'lodash';

import {TrialStageProps, make_trial_sequence, make_multiple_trials, ProgressBar} from '../common';
import {instruction_templates, SampleTrial, TaskDescriptionProps} from '../instructions';

interface TrialData {
  variables: {variable: string, value: string}[]
  recall_variables: string[]
  presentation_time: number
}

interface TrialState {
  response?: {variable: string, value: string}[]
}

export
let code_stage = (props: TrialStageProps<TrialData, TrialState>) => {
  let trial = props.trial;
  let prog = trial.variables.map((v) => `${v.variable} = ${v.value}`).join('\n');
  useEffect(() => { setTimeout(() => { props.next_stage(); }, trial.presentation_time); }, []);

  return <div>
    <pre>{prog}</pre>
    <ProgressBar duration={trial.presentation_time} />
  </div>
}

let input_stage = (props: TrialStageProps<TrialData, TrialState>) => {
  let trial = props.trial;
  let response: {[key:string]: string} = {};

  let submit = () => {
    props.next_stage({
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
        </div>
      )}
    </div>
    <button onClick={submit}>Next</button>
  </div>
}

let review_stage = (props: TrialStageProps<TrialData, TrialState>) => {
  let trial = props.trial;
  let response = props.state!.response!;

  let correct_values = _.chain(trial.variables).keyBy('variable').mapValues('value').value();
  let responses = _.chain(response).keyBy('variable').mapValues('value').value();
  let response_correct =
    _.mapValues(responses, (value, variable) => correct_values[variable] == value);

  useEffect(() => { setTimeout(() => props.trial_finished({response}), 3000); }, []);

  return <div>
    <div>
      {trial.recall_variables.map((v) =>
        <div className={response_correct[v] ? 'correct' : 'incorrect'}>
          <code>{v} = </code>
          <input className='exp-input' type="text"
            value={responses[v]} />
          <span className='correct-indicator'>
            {response_correct[v] ? <>✓</> : <>✗ ({correct_values[v]})</>}
          </span>
        </div>
      )}
    </div>
    <ProgressBar duration={3000} />
  </div>;
};

let TrialView = make_trial_sequence([code_stage, input_stage, review_stage]);
export let Experiment = make_multiple_trials<TrialData>(TrialView);

let sample_data: TrialData = {
  variables: [
    {variable: 'r', value: '5'},
    {variable: 'f', value: '2'},
    {variable: 't', value: '9'}
  ],
  recall_variables: ['f', 't', 'r'],
  presentation_time: 4500,
};

let sample_criterion = (trial: TrialData, response: any) => {
  let correct_values = _.chain(trial.variables).keyBy('variable').mapValues('value').value();
  let responses = _.chain(response.response).keyBy('variable').mapValues('value').value();
  let total_correct =
    _.chain(responses)
     .mapValues((value, variable) => correct_values[variable] == value ? 1 : 0)
     .values()
     .sum()
     .value();
  return total_correct == 3;
};

let TaskDescription = (props: TaskDescriptionProps) =>
    <div>
      <p>This is a 10-minute experiment to test your memory for variable/value pairs. You will be presented with a sequence of pairs like this:</p>

      <div className="indent"><pre>
        {`x = 4
q = 8
r = 2`}</pre></div>

      <p>Then you will be prompted with the same variables, randomly ordered. Your task is to enter the corresponding number. In the above example, if prompted for <code>q</code>, you should enter <code>8</code>.</p>

      <SampleTrial TrialView={TrialView} criterion={sample_criterion} trial_data={sample_data}
        on_finish={props.done} />
    </div>;

let instructions = [
  instruction_templates['no-tools']
]

export let instruction_params = {TaskDescription, instructions};
