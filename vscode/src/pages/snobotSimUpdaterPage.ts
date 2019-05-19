'use strict';

declare var acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

function selectProjectType() {
    vscode.postMessage({
      data: {
        projectFolder: (document.getElementById('projectFolder') as HTMLInputElement).value,
        robotName: (document.getElementById('robotName') as HTMLInputElement).value,
        use_eclipse: (document.getElementById('use_eclipse') as HTMLInputElement).checked,
        use_intellij: (document.getElementById('use_intellij') as HTMLInputElement).value,
        use_vscode: (document.getElementById('use_vscode') as HTMLInputElement).checked,
      },
      type: 'createproject',
    });
}

window.addEventListener('load', (_: Event) => {
  // tslint:disable-next-line:no-non-null-assertion
  document.getElementById('generateProject')!.onclick = selectProjectType;
});
