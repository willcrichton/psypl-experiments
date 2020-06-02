import React from 'react';
import ReactDOM from 'react-dom';

import {VariableCuedRecallExperiment, Explanation} from './variable_cued_recall';

let experiment_desc = `{"trials": [{"variables": [{"variable": "k", "value": 2}, {"variable": "t", "value": 6}, {"variable": "p", "value": 3}], "recall_variables": ["p", "k"], "presentation_time": 4500}], "between_trials_time": 2000}`;

let save_results = (results: any) => {
  console.log(results);
}

let props = JSON.parse(experiment_desc);

class Experiment extends React.Component {
  state = { started: false, finished: false }

  render() {
    let start = () => {this.setState({started: true})};
    return <div className='experiment'>{
      !this.state.started
        ? <div>
          <Explanation start={start}/>
        </div>
        : (!this.state.finished
          ? <VariableCuedRecallExperiment
              save_results={save_results}
              on_finished={() => {this.setState({finished: true})}}
              {...props} />
          : <div>
            <p>The experiment is complete. Thank you for your participation!</p>
            <p><input type="submit" value="Click here to conclude the HIT"/></p>
          </div>)
    }</div>;
  }
}

ReactDOM.render(<Experiment />, document.getElementById('experiment-container'));
