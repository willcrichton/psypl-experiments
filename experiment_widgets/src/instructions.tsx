import React, {useState, useContext} from 'react';
import {ProgressBar, ShowAnswersContext, ExperimentContext} from './common';

enum SampleState { Idle, Waiting, Playing, Finished }

export let InstructionReviewContext = React.createContext(false);

export interface SampleTrialProps {
  TrialView: any,
  on_finish: () => void,
  trial_data: any,
  criterion: (trial_data: any, response: any) => boolean,
  experiment?: any
}

export let SampleTrial = (props: SampleTrialProps) => {
  let [state, set_state] = useState(SampleState.Idle);
  let [response, set_response] = useState(undefined);
  let [tried, set_tried] = useState(false);
  let in_review = useContext(InstructionReviewContext);
  let TrialView = props.TrialView;
  let gate = !tried && !in_review;

  switch (state) {
    case SampleState.Idle: {
      return <button onClick={() => set_state(SampleState.Waiting)} className={gate ? 'primary' : ''}>
        {gate ? "Complete a sample trial to continue" : "Click here to try a sample trial" }
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
            experiment={props.experiment}
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

export let InstructionParamsContext = React.createContext<InstructionParams | null>(null);

export let Instructions = (props: {start?: () => void}) => {
  let [box_checked, set_box_checked] = useState(false);
  let [description_done, set_description_done] = useState(false);

  let {TaskDescription, instructions} = useContext(InstructionParamsContext)!;
  let experiment = useContext(ExperimentContext)!;

  let trial_time = experiment.trial_time || 120;
  let time_str = trial_time % 60 == 0 ? `${trial_time / 60} minutes` : `${trial_time} seconds`;

  return <div className='explanation-wrapper'>
    <div className='explanation'>
      <h1>Experiment Instructions</h1>
      <TaskDescription done={() => set_description_done(true)} />
    </div>

    {description_done
    ? <div>
      <p>Once you understand the task, please read the following instructions.</p>

      <ul>
        <li>You must give this experiment your undivided attention for its duration.</li>
        <li>Please participate in an environment without distractions.</li>
        <li>If you aren't sure of an answer, you should guess.</li>
        <li>You will have <strong>{time_str}</strong> to complete each trial, and there will be <strong>{experiment.trials.length}</strong> trials.</li>
        {instructions.map((el, i) => <li key={i}>{el}</li>)}
      </ul>

      {props.start
      ? <>
        <p>
          By checking the box below, you confirm that you understand the task and instructions above.
          <input type="checkbox" onChange={(e) => set_box_checked(e.target.checked)} />
        </p>

        <p>
          <button
            onClick={() => {if (box_checked) { props.start!(); }}}
            className={`primary ${box_checked ? '' : 'disabled'}`}>
            Start the experiment
          </button>
        </p>
      </>
      : null}
    </div>
    : null}
  </div>;
}
