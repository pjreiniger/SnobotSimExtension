'use strict';

declare var acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

function selectProjectType() {
    console.log('something>')
    
    vscode.postMessage({
      data: {
        use_vscode: (document.getElementById('use_vscode') as HTMLInputElement).checked,
        use_eclipse: (document.getElementById('use_eclipse') as HTMLInputElement).checked,
        use_intellij: (document.getElementById('use_intellij') as HTMLInputElement).value,
        projectFolder: (document.getElementById('projectFolder') as HTMLInputElement).value,
        robotName: (document.getElementById('robotName') as HTMLInputElement).value,
      },
      type: 'createproject',
    });
}

window.addEventListener('load', (_: Event) => {
  // tslint:disable-next-line:no-non-null-assertion
  document.getElementById('generateProject')!.onclick = selectProjectType;
});
