import React from 'react';
import axios from 'axios';
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

export
function make_multiple_trials<TrialData>(TrialView: React.ComponentType<TrialProps<TrialData>>) {
  return class extends React.Component<MultipleTrialsProps<TrialData>, {trial_i: number, waiting: boolean, start_time: number}> {
    state = {trial_i: -1, waiting: true, start_time: 0}

    next_trial() {
      this.setState({waiting: true});
      setTimeout(() => {
        if (this.state.trial_i == this.props.trials.length - 1) {
          this.props.on_finished();
        } else {
          this.setState({
            trial_i: this.state.trial_i + 1,
            waiting: false,
            start_time: now()
          });
        }
      }, this.props.between_trials_time);
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

      return <div>
        <div className='trial-counter'>
          Trial {this.state.trial_i+1}/{this.props.trials.length}
        </div>
        <div className='trial'>
          {this.state.waiting
          ? <span>Preparing next trial... <ProgressBar duration={this.props.between_trials_time} /></span>
          : <TrialView trial={this.props.trials[this.state.trial_i]}
                       finished={finished} />}
        </div>
      </div>
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

const BASE_URL = 'https://mindover.computer/api';
declare var EXPERIMENT_NAME: string;

export function get_experiment(): Promise<any> {
  return axios.get(
    `${BASE_URL}/generate_experiment`,
    {params: {experiment: EXPERIMENT_NAME}}
  );
}

export function record_results(description: any, participant: string, results: any) {
  axios.post(
      `${BASE_URL}/record_results`,
      {experiment: EXPERIMENT_NAME, description, participant, results});
}

export class SampleTrial extends React.Component<{TrialView: any}> {
  state = {playing: false, trials: []}

  componentDidMount() {
    get_experiment().then(({data}) => {
      this.setState({trials: data.trials});
    });
  }

  render() {
    let TrialView = this.props.TrialView;
    return this.state.playing
         ? (this.state.trials.length > 0
          ? <div className="indent">
              <TrialView
                trial={this.state.trials[Math.floor(Math.random() * this.state.trials.length)]}
                finished={() => {this.setState({playing: false})}} />
            </div>
          : <div>Loading...</div>)
         : <button onClick={() => {this.setState({playing: true})}}>Click here to try a sample task</button>;
  }
}
