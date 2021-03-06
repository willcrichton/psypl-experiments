import React, {useState, useContext} from 'react';
import {Line} from 'rc-progress';
import Editor from '@monaco-editor/react';
import ReactModal from 'react-modal';
import {Instructions, InstructionReviewContext} from './instructions';

function now(): number {
  return new Date().getTime();
}

export let ExperimentContext = React.createContext<null | any>(null);

export interface ProgressBarProps {
  duration: number
}

export class ProgressBar extends React.Component<ProgressBarProps> {
  state = {percent: 0}
  _timer: any

  componentDidMount() {
    this._timer = setInterval(() => {
      this.setState({percent: this.state.percent + 1});
    }, this.props.duration / 100);
  }

  componentWillUnmount() {
    clearInterval(this._timer);
  }

  render() {
    return <div className='progress-bar'>
      <Line percent={this.state.percent} strokeWidth={10} trailWidth={10} />
    </div>
  }
}

export
interface TrialStageProps<TrialData, TrialState = void> {
  trial: TrialData,
  state?: TrialState,
  next_stage: (state?: TrialState) => void,
  trial_finished: (results: any) => void
}

export type TrialSequenceProps<TrialData> = TrialStageProps<TrialData>;

export
interface TrialProps<TrialData> {
  trial: TrialData,
  finished: (results: any) => void
}

export
interface MultipleTrialsProps<TrialData> {
  save_results: (results: any) => void,
  on_finished: () => void,
  trials: TrialData[],
  between_trials_time: number
  break_frequency?: number
}

interface SequenceState<TrialState> {
  stage: number,
  state: TrialState | undefined
}


export
let make_trial_sequence = <TrialData, TrialState = void>(
  Views: React.ComponentType<TrialStageProps<TrialData, TrialState>>[],
  state?: TrialState
) => make_trial_generator(
  (props: TrialStageProps<TrialData, SequenceState<TrialState>>) => {
    let {stage, state} = props.state!;
    if (stage == Views.length) {
      return null;
    } else {
      let View = Views[stage];
      return <View key={stage}
                   trial={props.trial}
                   state={state}
                   trial_finished={props.trial_finished}
                   next_stage={(state?: TrialState) =>
                     props.next_stage({stage: stage + 1, state})} />
    }
  },
  {stage: 0, state});

export
let make_trial_generator = <TrialData, TrialState>(
  View: React.ComponentType<TrialStageProps<TrialData, TrialState>>,
  initial_state: TrialState
) => (props: TrialProps<TrialData>) => {
  let [state, setState] = useState({
    trial_state: initial_state,
    counter: 0
  });
  return <View trial={props.trial}
               state={state.trial_state}
               key={state.counter}
               next_stage={(trial_state) => {setState({
                 trial_state: trial_state!, counter: state.counter+1
               });}}
               trial_finished={props.finished} />;
};

const BREAK_TIME: number = 30 * 1000;

let ReviewInstructions = ({}) => {
  let [show, set_show] = useState(false);
  let width = 750;
  return <>
    <button className='trial-instructions' onClick={() => set_show(true)}>
      Review instructions
    </button>
    <ReactModal
      isOpen={show}
      shouldCloseOnOverlayClick={true}
      onRequestClose={() => set_show(false)}
      style={{content: {width: `${width}px`, left: `calc(50% - ${width/2}px)`}}}>
      <InstructionReviewContext.Provider value={true}>
        <div className='modal-header'>
          <button className='primary' onClick={() => set_show(false)}>Return to experiment</button>
          <strong>&nbsp; Note: the trial timer is still going!</strong>
        </div>
        <div className='modal-wrapper'>
          <Instructions />
        </div>
      </InstructionReviewContext.Provider>
    </ReactModal>
  </>
};


export
function make_multiple_trials<TrialData>(TrialView: React.ComponentType<TrialProps<TrialData>>) {
  return class extends React.Component<MultipleTrialsProps<TrialData>, {trial_i: number, waiting: boolean, start_time: number, on_break: boolean}> {
    state = {trial_i: -1, waiting: true, start_time: 0, on_break: false}

    next_trial() {
      let break_frequency = this.props.break_frequency || 10;
      let trial_i = this.state.trial_i;
      if (trial_i == this.props.trials.length - 1) {
        this.props.on_finished();
      } else {
        this.setState({waiting: true});
        setTimeout(() => {
          trial_i = trial_i + 1;
          this.setState({
            trial_i,
            waiting: false,
            on_break: trial_i > 0 && trial_i % break_frequency == 0,
            start_time: now()
          });
        }, this.props.between_trials_time);
      }
    };

    componentDidMount() {
      this.next_trial();
    }

    render() {
      let finished = (results: any) => {
        results['trial_time'] = now() - this.state.start_time;
        this.props.save_results(results);
        this.next_trial();
      };

      let trial_i = this.state.trial_i;
      if (this.state.on_break) {
        setTimeout(() => {
          this.setState({on_break: false, waiting: true})
          setTimeout(() => {
            this.setState({waiting: false});
          }, this.props.between_trials_time);
        }, BREAK_TIME);
      }

      return <div>
        <div className='trial-header'>
          <div className='trial-counter'>
            Trial {trial_i+1}/{this.props.trials.length}
          </div>
          <ReviewInstructions />
        </div>
        <div className='trial'>
          {this.state.on_break
          ? <div>
            <div>You have a 30 second break. Please be prepared to start the next trial at the end of the break.</div>
            <ProgressBar duration={BREAK_TIME} />
          </div>
          : (this.state.waiting
           ? <span>Preparing next trial... <ProgressBar duration={this.props.between_trials_time} /></span>
           : <TrialView key={trial_i}
                        trial={this.props.trials[trial_i]}
                        finished={finished} />)}
        </div>
      </div>;
    }
  }
}

export const ShowAnswersContext = React.createContext(true);

export interface ValueInputProps {
  onEnter?: (s: string) => void,
  onChange?: (s: string) => void,
  disabled?: boolean,
  value?: string,
  correct?: boolean,
  answer?: any,
  large?: boolean,
  input_ref?: React.RefObject<HTMLInputElement>,
}

export function ValueInput(props: ValueInputProps) {
  let correct = props.correct;
  let show_answers = useContext(ShowAnswersContext);
  return <span className={(correct !== undefined ? (correct ? 'correct' : 'incorrect') : '')}>
    <input type="text"
           className={`exp-input ${props.large ? 'large' : ''}`}
           ref={props.input_ref}
           autoFocus={true}
           disabled={props.disabled}
           value={props.value}
           onKeyPress={(e) => {
             if (e.key == 'Enter' && props.onEnter) {
               props.onEnter((e.target as HTMLInputElement).value);
             }
           }}
           onChange={(e) => {
             if (props.onChange) {
               props.onChange((e.target as HTMLInputElement).value);
             }
           }} />
    {correct !== undefined
    ? <span className='correct-indicator'>
      {correct ? <>✓</> : <>✗ {show_answers ? <>({props.answer!})</> : null}</>}
    </span>
    : null}
  </span>;
}

export let CodeView = (props: {program: string, language: string}) =>
  <Editor
    language={props.language}
    height={props.program.split('\n').length * 25}
    value={props.program}
    options={{
      readOnly: true,
      scrollBeyondLastLine: false,
      minimap: {enabled: false},
      fontSize: 16,
      lineNumbers: "off",
      folding: false
    }} />;
