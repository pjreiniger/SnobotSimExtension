import * as electron from 'electron';
import * as fs from 'fs';
import * as ncp from 'ncp';
import * as path from 'path';
import * as mkdirp from 'mkdirp';


const remote = electron.remote;
const dialog = remote.dialog;

function copyFile(source: string, dest: string) : Promise<void> {
	return new Promise<void>((resolve, reject) => {
      ncp.ncp(source, dest, {}, (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    })
}

function writeFile(filename: string, contents: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(filename, contents, 'utf8', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function makedir(directory : string) : Promise<void> {
  return new Promise<void>((resolve, reject) => {
    mkdirp(directory, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function readFile(filename : string) : Promise<string> {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function exists(filename : string) : Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    fs.exists(filename, (e) => {
      resolve(e);
    });
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

async function updateBuildFile(projectFolder: string) {
    const buildFile = path.join(projectFolder, 'build.gradle');
    const snobotSimPluginText = '\n    id "com.snobot.simulator.plugin.SnobotSimulatorPlugin" version "2019-3.0.0" apply false';
    const snobotSimJavaApplyPlugin = '//////////////////////////////////\n// SnobotSim\n//////////////////////////////////\napply plugin: com.snobot.simulator.plugin.SnobotSimulatorPlugin\napply from: "snobotsim/snobot_sim.gradle"\n//////////////////////////////////\n\n';
    const gradleBuildFile = await readFile(buildFile)
    let newgFile = gradleBuildFile.replace(getGradleRioRegex(), `$1${snobotSimPluginText}`);

    if (gradleBuildFile.search(getDefaultJavaDependenciesRegex()) !== -1) {
        newgFile = newgFile.replace(getDefaultJavaDependenciesRegex(), `${snobotSimJavaApplyPlugin}$1`);
    } else  {
        newgFile = newgFile.replace(getCleanedJavaDependenciesRegex(), `${snobotSimJavaApplyPlugin}$1`);
    }

    await writeFile(buildFile, newgFile);
}

async function setupSnobotSimFiles(projectFolder : string, toFolder : string) {
  //const enable_custom_sim_element = document.getElementById('enable_custom_sim') as HTMLInputElement
  const use_vscode = (document.getElementById('use_vscode') as HTMLInputElement).checked
  const use_eclipse = (document.getElementById('use_eclipse') as HTMLInputElement).checked
  const use_intellij = (document.getElementById('use_intellij') as HTMLInputElement).checked

  const configDir = path.join(projectFolder, 'simulator_config');

  await makedir(toFolder);
  await makedir(configDir);

  // Quick error checking
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

  // Get the resource paths to copy
  const basepath = electron.remote.app.getAppPath();
  let resourceRoot = path.join(basepath, 'resources');
  if (basepath.indexOf('default_app.asar') >= 0) {
    resourceRoot = 'resources';
  }

  // Copy common things
  const snobotSimPluginConfig = path.join(resourceRoot, 'shared', 'SnobotSim.json');
  const snobotSimGuiConfig = path.join(resourceRoot, 'shared', 'simulator_config.yml');
  await copyFile(snobotSimGuiConfig, path.join(configDir, 'simulator_config.yml'))
  await copyFile(snobotSimPluginConfig, path.join(toFolder, 'SnobotSim.json'))

  if(wpilibConfig.currentLanguage === "cpp") {
    const snobotSimGuiProperties = path.join(resourceRoot, 'cpp', 'simulator_config.properties');
    const snobotSimBuildScript = path.join(resourceRoot, 'cpp', 'snobot_sim.gradle');

    await copyFile(snobotSimGuiProperties, path.join(configDir, 'simulator_config.properties'))
    await copyFile(snobotSimBuildScript, path.join(toFolder, 'snobot_sim.gradle'))
  } else if(wpilibConfig.currentLanguage === "java") {
  
    const snobotSimGuiProperties = path.join(resourceRoot, 'java', 'simulator_config.properties');
    await copyFile(snobotSimGuiProperties, path.join(configDir, 'simulator_config.properties'))
	

    const add_custom_simulator = (document.getElementById('enable_custom_sim') as HTMLInputElement).checked
    let snobotSimBuildScript = ""
    if(add_custom_simulator) {
		snobotSimBuildScript = path.join(resourceRoot, 'java', 'snobot_sim_with_custom.gradle');
		const custom_simulator = path.join(resourceRoot, 'java', 'custom_robot_simulator.java');
		const custom_sim_src_dir = path.join(projectFolder, 'src', 'custom_simulator', 'frc', 'robot')
        await makedir(custom_sim_src_dir);
	    await copyFile(path.join(custom_sim_src_dir, 'CustomSimulator.java'), custom_simulator)
	} else {
		snobotSimBuildScript = path.join(resourceRoot, 'java', 'snobot_sim.gradle');	
	}
	
    let snobotSimGradleFile = await readFile(snobotSimBuildScript)
	
	if (use_eclipse) {
		const eclispeConfig = await readFile(path.join(resourceRoot, 'ide_files', 'eclipse', 'snobot_sim_addon.txt'))
		snobotSimGradleFile += eclispeConfig

	}
	
	await writeFile(path.join(toFolder, 'snobot_sim.gradle'), snobotSimGradleFile)
	
	if (use_vscode) {
	  alert("VS Code Not supported yet")
	}
	if (use_intellij) {
      const intellijFiles = path.join(resourceRoot, 'ide_files', 'intellij');
      await copyFile(intellijFiles, path.join(projectFolder, ".idea"))
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

export async function generateProjectButtonClick() {
  const projectFolder = (document.getElementById('projectFolder') as HTMLInputElement).value;


  if (!path.isAbsolute(projectFolder)) {
    alert('Can only use an absolute path');
    return;
  }
  const toFolder = path.join(projectFolder, 'snobotsim');
  const itExists = await exists(toFolder)

  if (!itExists) {
    setupSnobotSimFiles(projectFolder, toFolder)
  } else {
    validateSnobotSimFiles()
  }
}
