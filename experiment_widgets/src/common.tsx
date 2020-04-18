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
function make_trial_sequence<TrialData>(Views: React.ComponentType<TrialStageProps<TrialData>>[]) {
  return class extends React.Component<TrialProps<TrialData>> {
    state = {stage: 0}

    componentDidUpdate(prev_props: any) {
      if (prev_props != this.props) {
        this.setState({stage: 0});
      }
    }

    render() {
      let View = Views[this.state.stage];
      let next_stage = () => {
        this.setState({stage: this.state.stage + 1});
      }
      return <View trial={this.props.trial} next_stage={next_stage} trial_finished={this.props.finished} />;
    }
  }
}

export
function make_multiple_trials<TrialData>(TrialView: React.ComponentType<TrialProps<TrialData>>) {
  return class extends React.Component<MultipleTrialsProps<TrialData>, {trial_i: number, exp_start: boolean}> {
    state = {exp_start: false, trial_i: 0}

    render() {
      let {model, trials, between_trials_time} = this.props;

      let finished = (results: any) => {
        let all_results = JSON.parse(model.get('results'));
        all_results.push(results);
        model.set('results', JSON.stringify(all_results));
        model.save_changes();

        setTimeout(() => {
          this.setState({trial_i: this.state.trial_i + 1});
        }, between_trials_time);
      };

      let exp_start = () => {
        setTimeout(() => {
          this.setState({exp_start: true})
        }, between_trials_time);
      };

      return <div>
        {this.state.exp_start ?
          <TrialView trial={trials[this.state.trial_i]} finished={finished} /> :
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
