import React, {useState} from 'react';
import {ProgressBar} from './common';

enum SampleState { Idle, Waiting, Playing, Finished }

interface SampleTrialProps {
  TrialView: any,
  on_finish: () => void,
  trial_data: any,
  criterion: (trial_data: any, response: any) => boolean
}

let SampleTrial = (props: SampleTrialProps) => {
  let [state, set_state] = useState(SampleState.Idle);
  let [response, set_response] = useState(undefined);
  let TrialView = props.TrialView;

  switch (state) {
    case SampleState.Idle: {
      return <button onClick={() => set_state(SampleState.Waiting)}>
        Click here to try a sample trial
      </button>;
    }

    case SampleState.Waiting: {
      setTimeout(() => set_state(SampleState.Playing), 2000);
      return <div>
        Preparing sample trial...
        <ProgressBar duration={2000} />
      </div>;
    }

    case SampleState.Playing: {
      return <div className="indent">
        <TrialView
          trial={props.trial_data}
          finished={(response: any) => {
            set_response(response);
            set_state(SampleState.Finished);
          }} />
      </div>;
    }

    case SampleState.Finished: {
      let passed = props.criterion(props.trial_data, response);
      if (passed) {
        setTimeout(() => {
          props.on_finish();
          set_state(SampleState.Idle);
        }, 3000);

        return <div>
          That's the end of one trial.
          <ProgressBar duration={3000} />
        </div>;
      } else {
        setTimeout(() => {
          set_state(SampleState.Playing);
        }, 5000);

        return <>
          <div>You must pass the sample trial to continue. Retrying...</div>
          <ProgressBar duration={5000} />
        </>;
      }
    }
  }
}

export interface InstructionParams {
  TaskDescription: React.ComponentType
  TrialView: React.ComponentType<any>,
  sample_data: any
  sample_criterion: any,
  instructions: JSX.Element[]
}

export let instruction_templates = {
  'no-tools': <><strong>DO NOT</strong> use pen & paper, a digital notepad, or any other tool to help your memory during the experiment.,</>,
  'no-scratch': <>Do not use the input box as a scratchpad.</>
};

export let Instructions = (props: {params: InstructionParams, experiment: any, start: () => void}) => {
  let [box_checked, set_box_checked] = useState(false);
  let [sample_tried, set_sample_tried] = useState(false);
  let {TaskDescription, TrialView, sample_data, sample_criterion, instructions} = props.params;

  return <div className='explanation-wrapper'>
    <div className='explanation'>
      <TaskDescription />
    </div>

    <SampleTrial TrialView={TrialView} on_finish={() => set_sample_tried(true)}
                 trial_data={sample_data} criterion={sample_criterion} />

    {sample_tried
    ? <div>
      <p>Once you understand the task, please read the following instructions.</p>

      <ul>
        <li>You must give this experiment your undivided attention for its duration. A 30-second break will be provided every 10 trials.</li>
        <li>Please participate in an environment without distractions, either sounds or images.</li>
        <li>If you aren't sure of an answer, you should guess.</li>
        {instructions}
      </ul>

      <p>
        I understand the task and instructions above:
        <input type="checkbox" onChange={(e) => set_box_checked(e.target.checked)} />
      </p>

      <p>
        <button
          onClick={() => {if (box_checked) { props.start(); }}}
          className={`primary ${box_checked ? '' : 'disabled'}`}>
          Start the experiment
        </button>
      </p>
    </div>
    : null}
  </div>;
}
