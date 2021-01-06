import React, {useState} from 'react';
import Editor from '@monaco-editor/react';
import {TrialProps, make_multiple_trials, ProgressBar} from '../common';
import axios from 'axios';

interface TrialData {
  prompt: string
  program: string
}

let CodeView = (props: {program: string}) => {
  let [editor, set_editor] = useState(null);
  let [waiting, set_waiting] = useState(false);
  let [console, set_console] = useState({stdout: '', stderr: ''});
  let run = async () => {
    let ed = editor! as any;
    set_waiting(true);
    let {data} = await axios.post(
      'https://mindover.computer/api/run_program',
      {program: ed.getValue(),language: 'rust'});
    set_waiting(false);
    set_console(data);
  };
  return <>
    <div className='editor-container'>
      <div className='editor'>
        <button onClick={run} disabled={waiting}>{waiting ? '◦◦◦' : 'Run'}</button>
        <Editor
          language="rust"
          height={Math.max(400, props.program.split('\n').length * 25)}
          value={props.program}
          editorDidMount={(_, ed) => {
            ed.getModel().updateOptions({tabSize: 2});
            set_editor(ed);
          }}
          options={{
            scrollBeyondLastLine: false,
            minimap: {enabled: false},
            fontSize: 16,
            folding: false,
            lineNumbersMinChars: 2
          }} />
      </div>
      <div className='console'>
        <div><strong>Console output:</strong></div>
        <code className='stdout'>{console.stdout}</code>
        <code className='stderr'>{console.stderr}</code>
      </div>
    </div>
  </>;
}
let TrialView = (props: TrialProps<TrialData>) => {
  let trial = props.trial;
  return <div>
    <p>{trial.prompt}</p>
    <CodeView program={trial.program} />
  </div>;
};

export let Experiment = make_multiple_trials<TrialData>(TrialView);
