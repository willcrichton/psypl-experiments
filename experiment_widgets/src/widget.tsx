// Copyright (c)
// Distributed under the terms of the Modified BSD License.

// Import the CSS
import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import {DOMWidgetView, DOMWidgetModel} from '@jupyter-widgets/base';
import '../css/widget.scss';
import {ExperimentContext} from './common';
import {InstructionParamsContext} from './instructions';

export class ExperimentModel extends DOMWidgetModel {};

export class ExperimentWidget extends DOMWidgetView {
  render() {
    let model = this.model;

    let save_results = (results: any) => {
      let all_results = JSON.parse(model.get('results'));
      all_results.push(results);
      model.set('results', JSON.stringify(all_results));
      model.save_changes();
    };

    model.on('change', () => {this.touch();});
    let name = model.get('experiment_name');
    let props = JSON.parse(model.get('experiment_data'));

    (async () => {
      let [base, file] = name.split('/');
      let module;
      if (base == '') {
        module = import(`./experiments/${file}.tsx`);
      } else if (base == 'preconditions') {
        module = import(`./experiments/preconditions/${file}.tsx`);
      } else {
        throw "Need to add stupid import statement to widget.tsx";
      }

      let {Experiment, instruction_params} = await module;

      let View = () => {
        let [started, set_started] = useState(false);
        let [finished, set_finished] = useState(false);

        return <ExperimentContext.Provider value={props}>
          <InstructionParamsContext.Provider value={instruction_params}>
            <div className='experiment'>{
              !started
              ? <button onClick={() => {set_started(true);}}>
                Click to start the experiment when you're ready
              </button>
              : (!finished
               ? <Experiment save_results={save_results}
                             on_finished={() => set_finished(true)}
                             {...props} />
           : <div>Done!</div>)
            }</div>
          </InstructionParamsContext.Provider>
        </ExperimentContext.Provider>;
      };

      ReactDOM.render(<View />, this.el);
    })()
  }
}
