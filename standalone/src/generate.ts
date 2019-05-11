import * as electron from 'electron';
import * as fs from 'fs';
import * as ncp from 'ncp';
import * as path from 'path';


const remote = electron.remote;
const dialog = remote.dialog;

function copyFile(source: string, dest: string) {
    //alert("Copying from " + source + " to " + dest)
    ncp.ncp(source, dest, {}, (err) => {
        if (err) {
            dialog.showMessageBox({
                message: 'error: ' + err,
                noLink: true,
            });
        }
    });
}

function writeFile(filename: string, outputText: string) {
    fs.writeFile(filename, outputText, (err) => {
        if (err) {
            dialog.showMessageBox({
                message: 'error: ' + err,
                noLink: true,
            });
        }
    });
}


function getGradleRioRegex() {
  return /(id\s*?[\"|\']edu\.wpi\.first\.GradleRIO[\"|\'].*?version\s*?[\"|\'].+?[\"|\'])/g;
}

function getDefaultJavaDependenciesRegex() {
  return /(\/\/ Defining my dependencies\. In this case, WPILib \(\+ friends\), and vendor libraries\.)/g;
}

function getCleanedJavaDependenciesRegex() {
  return /(dependencies \{)/g;
}

function updateBuildFile(projectFolder: string) {
    const buildFile = path.join(projectFolder, 'build.gradle');
    const snobotSimPluginText = '\n    id "com.snobot.simulator.plugin.SnobotSimulatorPlugin" version "2019-3.0.0" apply false';
    const snobotSimJavaApplyPlugin = '//////////////////////////////////\n// SnobotSim\n//////////////////////////////////\napply plugin: com.snobot.simulator.plugin.SnobotSimulatorPlugin\napply from: "snobotsim/snobot_sim.gradle"\n//////////////////////////////////\n\n';
    const gradleBuildFile = fs.readFileSync(buildFile, 'utf8')
    let newgFile = gradleBuildFile.replace(getGradleRioRegex(), `$1${snobotSimPluginText}`);

    if (gradleBuildFile.search(getDefaultJavaDependenciesRegex()) !== -1) {
        newgFile = newgFile.replace(getDefaultJavaDependenciesRegex(), `${snobotSimJavaApplyPlugin}$1`);
    } else  {
        newgFile = newgFile.replace(getCleanedJavaDependenciesRegex(), `${snobotSimJavaApplyPlugin}$1`);
    }

    writeFile(buildFile, newgFile);
}

function setupSnobotSimFiles(projectFolder : string, toFolder : string) {
  //const enable_custom_sim_element = document.getElementById('enable_custom_sim') as HTMLInputElement
  const use_vscode = (document.getElementById('use_vscode') as HTMLInputElement).checked
  const use_eclipse = (document.getElementById('use_eclipse') as HTMLInputElement).checked
  const use_intellij = (document.getElementById('use_intellij') as HTMLInputElement).checked

  const configDir = path.join(projectFolder, 'simulator_config');

  fs.mkdirSync(toFolder);
  fs.mkdirSync(configDir);

  // Quick error checking
  const jsonFilePath = path.join(projectFolder, '.wpilib', 'wpilib_preferences.json');
  if (!fs.existsSync(jsonFilePath)) {
    dialog.showMessageBox({
        message: 'This doesnt look like a WPILib project, bailing',
        noLink: true,
        });
    return;
  }

  // Read the wpilib settings to figure out the project type
  const wpilibConfig = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

  // Get the resource paths to copy
  const basepath = electron.remote.app.getAppPath();
  let resourceRoot = path.join(basepath, 'resources');
  if (basepath.indexOf('default_app.asar') >= 0) {
    resourceRoot = 'resources';
  }

  // Copy common things
  const snobotSimPluginConfig = path.join(resourceRoot, 'shared', 'SnobotSim.json');
  const snobotSimGuiConfig = path.join(resourceRoot, 'shared', 'simulator_config.yml');
  copyFile(snobotSimGuiConfig, path.join(configDir, 'simulator_config.yml'))
  copyFile(snobotSimPluginConfig, path.join(toFolder, 'SnobotSim.json'))

  if(wpilibConfig.currentLanguage === "cpp") {
    const snobotSimGuiProperties = path.join(resourceRoot, 'cpp', 'simulator_config.properties');
    const snobotSimBuildScript = path.join(resourceRoot, 'cpp', 'snobot_sim.gradle');

    copyFile(snobotSimGuiProperties, path.join(configDir, 'simulator_config.properties'))
    copyFile(snobotSimBuildScript, path.join(toFolder, 'snobot_sim.gradle'))
  } else if(wpilibConfig.currentLanguage === "java") {
  
    const snobotSimGuiProperties = path.join(resourceRoot, 'java', 'simulator_config.properties');
    copyFile(snobotSimGuiProperties, path.join(configDir, 'simulator_config.properties'))
	

    const add_custom_simulator = (document.getElementById('enable_custom_sim') as HTMLInputElement).checked
    let snobotSimBuildScript = ""
    if(add_custom_simulator) {
		snobotSimBuildScript = path.join(resourceRoot, 'java', 'snobot_sim_with_custom.gradle');	
	} else {
		snobotSimBuildScript = path.join(resourceRoot, 'java', 'snobot_sim.gradle');	
	}
	
    let snobotSimGradleFile = fs.readFileSync(snobotSimBuildScript, 'utf8')
	
	if (use_eclipse) {
		const eclispeConfig = fs.readFileSync(path.join(resourceRoot, 'ide_files', 'eclipse', 'snobot_sim_addon.txt'), 'utf8')
		snobotSimGradleFile += eclispeConfig

	}
	
	writeFile(path.join(toFolder, 'snobot_sim.gradle'), snobotSimGradleFile)
	
	if (use_vscode) {
	  alert("VS Code Not supported yet")
	}
	if (use_intellij) {
      const intellijFiles = path.join(resourceRoot, 'ide_files', 'intellij');
      copyFile(intellijFiles, path.join(projectFolder, ".idea"))
	}
  }

  updateBuildFile(projectFolder)

  dialog.showMessageBox({
      message: 'Succesfully added SnobotSim to your project',
      noLink: true,
    });
}

function validateSnobotSimFiles() {

  dialog.showMessageBox({
      message: 'Validated SnobotSim installation',
      noLink: true,
    });
}

export function generateProjectButtonClick() {
  const projectFolder = (document.getElementById('projectFolder') as HTMLInputElement).value;


  if (!path.isAbsolute(projectFolder)) {
    alert('Can only use an absolute path');
    return;
  }
  const toFolder = path.join(projectFolder, 'snobotsim');

  if (!fs.existsSync(toFolder)) {
    setupSnobotSimFiles(projectFolder, toFolder)
  } else {
    validateSnobotSimFiles()
  }
}
