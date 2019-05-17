import * as electron from 'electron';
import * as path from 'path';
import { setupSnobotSimFiles } from './shared/add_config';
import { exists, readFile } from './shared/file_utils';

const remote = electron.remote;
const dialog = remote.dialog;

function validateSnobotSimFiles() {

  dialog.showMessageBox({
      message: 'Validated SnobotSim installation',
      noLink: true,
    });
}

export async function generateProjectButtonClick() {
  const projectFolder = (document.getElementById('projectFolder') as HTMLInputElement).value;

  if (!path.isAbsolute(projectFolder)) {
    alert('Can only use an absolute path');
    return;
  }

  const toFolder = path.join(projectFolder, 'snobotsim');
  const itExists = await exists(toFolder);

  if (!itExists) {
    const basepath = electron.remote.app.getAppPath();

    const jsonFilePath = path.join(projectFolder, '.wpilib', 'wpilib_preferences.json');
    if (!exists(jsonFilePath)) {
      dialog.showMessageBox({
          message: 'This doesnt look like a WPILib project, bailing',
          noLink: true,
          });
      return;
    }

    // Read the wpilib settings to figure out the project type
    const wpilibConfig = JSON.parse(await readFile(jsonFilePath));

    await setupSnobotSimFiles(wpilibConfig, basepath, projectFolder, toFolder);

    dialog.showMessageBox({
        message: 'Succesfully added SnobotSim to your project',
        noLink: true,
      });
  } else {
    validateSnobotSimFiles();
  }
}
