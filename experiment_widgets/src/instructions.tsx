import React, {useState} from 'react';
import {ProgressBar, ShowAnswersContext} from './common';

enum SampleState { Idle, Waiting, Playing, Finished }

export interface SampleTrialProps {
  TrialView: any,
  on_finish: () => void,
  trial_data: any,
  criterion: (trial_data: any, response: any) => boolean
}

export let SampleTrial = (props: SampleTrialProps) => {
  let [state, set_state] = useState(SampleState.Idle);
  let [response, set_response] = useState(undefined);
  let [tried, set_tried] = useState(false);
  let TrialView = props.TrialView;

  switch (state) {
    case SampleState.Idle: {
      return <button onClick={() => set_state(SampleState.Waiting)} className={tried ? '' : 'primary'}>
        {tried ? "Click here to try a sample trial" : "Complete a sample trial to continue"}
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
        <ShowAnswersContext.Provider value={false}>
          <TrialView
            trial={props.trial_data}
            finished={(response: any) => {
              set_response(response);
              set_state(SampleState.Finished);
            }} />
        </ShowAnswersContext.Provider>
      </div>;
    }

    case SampleState.Finished: {
      let passed = props.criterion(props.trial_data, response);
      if (passed) {
        setTimeout(() => {
          set_state(SampleState.Idle);
          set_tried(true);
          props.on_finish();
        }, 3000);

        return <div>
          That's the end of the sample trial.
          <ProgressBar duration={3000} />
        </div>;
      } else {
        setTimeout(() => {
          set_state(SampleState.Playing);
        }, 4000);

        return <>
          <div>You must pass the sample trial to continue. Retrying...</div>
          <ProgressBar duration={4000} />
        </>;
      }
    }
  }
}

export interface TaskDescriptionProps {
  done: () => void
}

export interface InstructionParams {
  TaskDescription: React.ComponentType<TaskDescriptionProps>
  instructions: JSX.Element[]
}

export let instruction_templates = {
  'no-tools': <><strong>DO NOT</strong> use pen & paper, a digital notepad, or any other tool to help your memory during the experiment.</>,
  'no-scratch': <>Do not use the input box as a scratchpad.</>
};

export let Instructions = (props: {params: InstructionParams, experiment: any, start: () => void}) => {
  let [box_checked, set_box_checked] = useState(false);
  let [description_done, set_description_done] = useState(false);
  let {TaskDescription, instructions} = props.params;

  return <div className='explanation-wrapper'>
    <div className='explanation'>
      <TaskDescription done={() => set_description_done(true)}/>
    </div>

    {description_done
    ? <div>
      <p>Once you understand the task, please read the following instructions.</p>

      <ul>
        <li>You must give this experiment your undivided attention for its duration. A 30-second break will be provided every {props.experiment.break_frequency || 10} trials.</li>
        <li>Please participate in an environment without distractions, either sounds or images.</li>
        <li>If you aren't sure of an answer, you should guess.</li>
        <li>If you are inputting a negative number, you should write a minus sign before the number, e.g. "-5".</li>
        <li>If you find these tasks too challenging or tiring, please return the HIT. <strong>Your response will be rejected if you do not attempt all of the tasks.</strong></li>
        {instructions.map((el, i) => <li key={i}>{el}</li>)}
      </ul>

      <p>
        By checking the box below, you confirm that you understand the task and instructions above.
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
