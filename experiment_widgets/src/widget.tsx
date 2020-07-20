// Copyright (c)
// Distributed under the terms of the Modified BSD License.

// Import the CSS
import React from 'react';
import ReactDOM from 'react-dom';
import {DOMWidgetView, DOMWidgetModel} from '@jupyter-widgets/base';
import '../css/widget.scss';

export class ExperimentModel extends DOMWidgetModel {};

function make_widget_view(Experiment: any): any {
  return class extends DOMWidgetView {
    render() {
      let model = this.model;

      let save_results = (results: any) => {
        let all_results = JSON.parse(model.get('results'));
        all_results.push(results);
        model.set('results', JSON.stringify(all_results));
        model.save_changes();
      };

      model.on('change', () => {this.touch();});
      let props = JSON.parse(model.get('experiment'));

      class View extends React.Component {
        state = {started: false, finished: false}

        render() {
          let on_finished = () => {
            this.setState({finished: true});
          };

          return <div className='experiment'>{
            !this.state.started
              ? <button onClick={() => {this.setState({started: true})}}>
                Click to start the experiment when you're ready
              </button>
              : (!this.state.finished
                ? <Experiment save_results={save_results}
                              on_finished={on_finished}
                              {...props} />
                : <div>Done!</div>)
          }</div>;
        }
      }

      ReactDOM.render(<View />, this.el);
    }
  }
}

/* import {Experiment as VariableSpanExperiment} from './experiments/variable_span';
* export let VariableSpanView = make_widget_view(VariableSpanExperiment);
*
* import {Experiment as VariableArithmeticMemoryExperiment} from './experiments/variable_arithmetic_memory';
* export let VariableArithmeticMemoryView = make_widget_view(VariableArithmeticMemoryExperiment);
*
* import {Experiment as VariableTracingExperiment} from './experiments/variable_tracing';
* export let VariableTracingView = make_widget_view(VariableTracingExperiment);
*
* import {Experiment as VariableTracingHardExperiment} from './experiments/variable_tracing_hard';
* export let VariableTracingHardView = make_widget_view(VariableTracingHardExperiment);
*  */

import {Experiment as VariableArithmeticSequenceExperiment} from './experiments/variable_arithmetic_sequence';
export let VariableArithmeticSequenceView = make_widget_view(VariableArithmeticSequenceExperiment);

import {Experiment as VariableCuedRecallExperiment} from './experiments/variable_cued_recall';
export let VariableCuedRecallView = make_widget_view(VariableCuedRecallExperiment);

import {Experiment as FunctionBasicExperiment} from './experiments/function_basic';
export let FunctionBasicView = make_widget_view(FunctionBasicExperiment);
