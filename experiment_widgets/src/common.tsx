import React from 'react';
import ReactDOM from 'react-dom';

import {
  DOMWidgetView,
  DOMWidgetModel
} from '@jupyter-widgets/base';

export
interface TrialStageProps<TrialData> {
  trial: TrialData,
  next_stage: () => void,
  trial_finished: (results: any) => void
}

interface TrialProps<TrialData> {
  trial: TrialData,
  finished: (results: any) => void
}

interface MultipleTrialsProps<TrialData> {
  model: DOMWidgetModel,
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
  return class extends React.Component<MultipleTrialsProps<TrialData>, {trial_i: number, exp_start: boolean, waiting: boolean}> {
    state = {exp_start: false, trial_i: 0, waiting: false}

    render() {
      let {model, trials, between_trials_time} = this.props;

      let finished = (results: any) => {
        let all_results = JSON.parse(model.get('results'));
        all_results.push(results);
        model.set('results', JSON.stringify(all_results));
        model.save_changes();

        this.setState({waiting: true});
        setTimeout(() => {
          this.setState({trial_i: this.state.trial_i + 1, waiting: false});
        }, between_trials_time);
      };

      let exp_start = () => {
        this.setState({exp_start: true, waiting: true})
        setTimeout(() => {
          this.setState({waiting: false});
        }, between_trials_time);
      };

      return <div>
        {this.state.exp_start ?
          (this.state.waiting ?
            <span>Waiting for next trial...</span> :
            <TrialView trial={trials[this.state.trial_i]} finished={finished} />) :
          <button onClick={exp_start}>
            Click to start experiment
          </button>}
      </div>
    }
  }
}

export function make_widget_view(View: any): any {
  return class extends DOMWidgetView {
    render() {
      this.model.on('change', () => {this.touch();});
      let props = JSON.parse(this.model.get('experiment'));
      ReactDOM.render(
        <View model={this.model} {...props} />,
        this.el);
    }
  }
}
