'use strict';

declare var acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

function selectProjectType() {
    vscode.postMessage({
      data: {
        robotName: (document.getElementById('robotName') as HTMLInputElement).value,
        use_eclipse: (document.getElementById('use_eclipse') as HTMLInputElement).checked,
        use_intellij: (document.getElementById('use_intellij') as HTMLInputElement).value,
        use_vscode: false,
      },
      type: 'createproject',
    });
}

window.addEventListener('load', (_: Event) => {
  // tslint:disable-next-line:no-non-null-assertion
  document.getElementById('generateProject')!.onclick = selectProjectType;
});
