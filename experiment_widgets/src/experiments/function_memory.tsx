import React from 'react';
import {EditorView, PluginValue, ViewUpdate, ViewPlugin, Decoration} from "@codemirror/next/view";
import {EditorState} from "@codemirror/next/state";
import {RangeSetBuilder, RangeSet} from "@codemirror/next/rangeset";
import {defaultHighlighter} from "@codemirror/next/highlight";

import {instruction_templates, TaskDescriptionProps, SampleTrial} from '../instructions';
import {TrialProps, make_multiple_trials, ValueInput, ProgressBar} from '../common';
import {AnswerBar, sample_criterion} from './function_basic';

interface FunctionRef {
  start: number
  end: number
  name: string
}

interface TrialData {
  functions: {[name: string]: {source: string, refs: FunctionRef[]}}
  call?: string
  answer: string
}

class FunctionRefLink implements PluginValue {
  decorations: RangeSet<Decoration>

  constructor(refs: FunctionRef[], on_click: (ref: FunctionRef) => void) {
    let builder = new RangeSetBuilder<Decoration>();
    refs.forEach((ref, i) => {
      let mark = Decoration.mark({
        tagName: 'a', attributes: {color: 'red', href: '#', onClick: `window.func_ref_click(${i})`}
      });
      builder.add(ref.start, ref.end, mark);
    });
    this.decorations = builder.finish();

    (window as any).func_ref_click = (i: number) => on_click(refs[i]);
  }

  update(update: ViewUpdate) {
    // pass
  }
}

class TrialView extends React.Component<TrialProps<TrialData>> {
  history = ['main']
  telemetry: any[] = []
  editor_ref = React.createRef<HTMLDivElement>()
  start_time = 0

  add_telemetry(action: string, target: string) {
    this.telemetry.push({
      action, target,
      history: [...this.history],
      timestamp: Date.now() - this.start_time
    });
  }

  render_editor() {
    let func = this.props.trial.functions[this.history[this.history.length - 1]];

    let on_click = (ref: FunctionRef) => {
      this.add_telemetry('enter', ref.name);
      this.history.push(ref.name);
      this.forceUpdate();
    };

    let extensions = [
      EditorView.editable.of(false),
      ViewPlugin.define((_: any) => new FunctionRefLink(func.refs, on_click)).decorations()
    ];

    let state = EditorState.create({doc: func.source, extensions});
    let view = new EditorView({state});

    let node = this.editor_ref.current!;
    node.innerHTML = '';
    node.appendChild(view.dom);
  }

  componentDidMount() {
    this.render_editor();
    this.start_time = Date.now();
  }

  componentDidUpdate() {
    this.render_editor();
  }

  render() {
    return <div>
      <div>
        <button disabled={this.history.length == 1} onClick={() => {
          this.add_telemetry('leave', this.history[this.history.length - 1]);
          this.history.pop();
          this.forceUpdate();
        }}>Go back</button>
      </div>
      <div ref={this.editor_ref} />
      <hr />
      <AnswerBar answer={this.props.trial.answer} answer_time={2} timeout={90}
                 finished={(response: any) => this.props.finished({
                   telemetry: this.telemetry, ...response})}
                 check_answer={(answer: string) => answer == this.props.trial.answer}
                 call={this.props.trial.call} />
    </div>
  }
}

export let Experiment = make_multiple_trials<TrialData>(TrialView);

let trial_data: TrialData = {'functions': {'main': {'source': 'j()\n',
   'refs': [{'start': 0, 'end': 3, 'name': 'j'}]},
  'j': {'source': 'def j():\n    return s() + 2\n',
   'refs': [{'start': 20, 'end': 23, 'name': 's'}]},
  's': {'source': 'def s():\n    return 1 + y()\n',
   'refs': [{'start': 24, 'end': 27, 'name': 'y'}]},
  'y': {'source': 'def y():\n    return 3 + 1\n', 'refs': []}},
 'call': 'j()',
 'answer': '7'};

let TaskDescription = (props: TaskDescriptionProps) =>
  <div>
    <p>This is an experiment to test your ability to mentally compute the output of short Python programs. Your task is to compute the answer accurately, and as quickly as possible. Your time to answer will be measured.</p>

    <p>These programs will be presented in an unfamiliar way. You will only see one function at a time. You can click on a function call to see the definition, and you can click "Back" to go to the previous function. Try out a sample:</p>

    <SampleTrial TrialView={TrialView} on_finish={props.done} criterion={sample_criterion} trial_data={trial_data} />
  </div>;

let instructions = [
  <>{instruction_templates['no-tools']} {instruction_templates['no-scratch']}</>
];

export let instruction_params =
  {TaskDescription, instructions};
