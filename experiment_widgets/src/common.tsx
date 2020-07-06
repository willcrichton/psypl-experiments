import React from 'react';
import {Line} from 'rc-progress';

function now(): number {
  return new Date().getTime();
}

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
interface TrialStageProps<TrialData, TrialState> {
  trial: TrialData,
  next_stage: (state: TrialState) => void,
  trial_finished: (results: any) => void
}

export
interface TrialSequenceProps<TrialData> {
  trial: TrialData,
  next_stage: () => void,
  trial_finished: (results: any) => void
}

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
}

export
function make_trial_sequence<TrialData>(
  Views: React.ComponentType<TrialSequenceProps<TrialData>>[]
): React.ComponentType<TrialProps<TrialData>> {
  return make_trial_generator((i: number) => (props: TrialStageProps<TrialData, number>) => {
    if (i == Views.length) {
      return null;
    } else {
      let View = Views[i];
      return <View trial={props.trial}
                   trial_finished={props.trial_finished}
                   next_stage={() => props.next_stage(i + 1)} />
    }
  }, 0);
}

export
type StageGenerator<TrialData, TrialState> =
  (state: TrialState) => React.ComponentType<TrialStageProps<TrialData, TrialState>>;

export
function make_trial_generator<TrialData, TrialState>(
  gen_view: StageGenerator<TrialData, TrialState>,
  initial_state: TrialState): React.ComponentType<TrialProps<TrialData>>
{
  return class extends React.Component<TrialProps<TrialData>, {state: TrialState}> {
    state = {state: initial_state}

    componentDidUpdate(prev_props: any) {
      if (prev_props != this.props) {
        this.setState({state: initial_state});
      }
    }

    render() {
      let View = gen_view(this.state.state);
      let next_stage = (state: TrialState) => {
        this.setState({state});
      };
      return <View trial={this.props.trial} next_stage={next_stage} trial_finished={this.props.finished} />;
    }
  }
}

const BREAK_TIME: number = 30 * 1000;
const BREAK_EVERY: number = 10;

export
function make_multiple_trials<TrialData>(TrialView: React.ComponentType<TrialProps<TrialData>>) {
  return class extends React.Component<MultipleTrialsProps<TrialData>, {trial_i: number, waiting: boolean, start_time: number, on_break: boolean}> {
    state = {trial_i: -1, waiting: true, start_time: 0, on_break: false}

    next_trial() {
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
            on_break: trial_i > 0 && trial_i % BREAK_EVERY == 0,
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
        setTimeout(() => this.setState({on_break: false}), BREAK_TIME);
      }

      return <div>
        <div className='trial-counter'>
          Trial {trial_i+1}/{this.props.trials.length}
        </div>
        <div className='trial'>
          {this.state.on_break
          ? <div>
            <div>You have a 30 second break. Please be prepared to start the next trial at the end of the break.</div>
            <ProgressBar duration={BREAK_TIME} />
          </div>
          : (this.state.waiting
           ? <span>Preparing next trial... <ProgressBar duration={this.props.between_trials_time} /></span>
           : <TrialView trial={this.props.trials[trial_i]}
                        finished={finished} />)}
        </div>
      </div>;
    }
  }
}

export function ValueInput(props: {onEnter: (s: string) => void, disabled?: boolean}) {
  return (
    <input type="text"
           className="exp-input"
           autoFocus={true}
           disabled={props.disabled}
           onKeyPress={(e) => {
             if (e.key == 'Enter') {
               props.onEnter((e.target as HTMLInputElement).value);
             }}} />
  );
}
