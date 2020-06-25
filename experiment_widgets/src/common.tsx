import React from 'react';
import '../css/widget.scss';

function now(): number {
  return new Date().getTime();
}

export
interface TrialStageProps<TrialData> {
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
function make_trial_sequence<TrialData>(Views: React.ComponentType<TrialStageProps<TrialData>>[]): React.ComponentType<TrialProps<TrialData>> {
  return make_trial_generator((i) => {
    if (i == Views.length) {
      return null;
    } else {
      return {view: Views[i], state: i + 1};
    }
  }, 0);
}

type StageGenerator<TrialData, TrialState> = (state: TrialState) => ({
  view: React.ComponentType<TrialStageProps<TrialData>>,
  state: TrialState
} | null);

export
function make_trial_generator<TrialData, TrialState>(gen_view: StageGenerator<TrialData, TrialState>, initial_state: TrialState): React.ComponentType<TrialProps<TrialData>> {
  return class extends React.Component<TrialProps<TrialData>, {state: TrialState}> {
    state = {state: initial_state}

    componentDidUpdate(prev_props: any) {
      if (prev_props != this.props) {
        this.setState({state: initial_state});
      }
    }

    render() {
      let stage = gen_view(this.state.state);
      let next_stage = () => {
        this.setState({state: stage!.state});
      };
      return stage ? <stage.view trial={this.props.trial} next_stage={next_stage} trial_finished={this.props.finished} /> : null;
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
          {this.state.waiting ?
            <span>Preparing next trial...</span> :
            <TrialView trial={this.props.trials[this.state.trial_i]}
                       finished={finished} />}
        </div>
      </div>
    }
  }
}

export function ValueInput(props: {onEnter: (s: string) => void}) {
  return (
    <input type="text"
           className="exp-input"
                autoFocus={true}
           onKeyPress={(e) => {
             if (e.key == 'Enter') {
               props.onEnter((e.target as HTMLInputElement).value);
             }}} />
  );
}
