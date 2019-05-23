
import * as path from 'path';
import { copyFile, makedir, readFile, writeFile } from './file_utils';

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
    // tslint:disable-next-line
    const snobotSimJavaApplyPlugin = '//////////////////////////////////\n// SnobotSim\n//////////////////////////////////\napply plugin: com.snobot.simulator.plugin.SnobotSimulatorPlugin\napply from: "snobotsim/snobot_sim.gradle"\n//////////////////////////////////\n\n';
    const gradleBuildFile = await readFile(buildFile);
    let newgFile = gradleBuildFile.replace(getGradleRioRegex(), `$1${snobotSimPluginText}`);

    // tslint:disable-next-line
    if (gradleBuildFile.search(getDefaultJavaDependenciesRegex()) !== -1) {
        newgFile = newgFile.replace(getDefaultJavaDependenciesRegex(), `${snobotSimJavaApplyPlugin}$1`);
    } else  {
        newgFile = newgFile.replace(getCleanedJavaDependenciesRegex(), `${snobotSimJavaApplyPlugin}$1`);
    }

    await writeFile(buildFile, newgFile);
}

// tslint:disable-next-line
export async function setupSnobotSimFiles(wpilibConfig: any, basepath: string, projectFolder: string, toFolder: string) {
  const useVsCode = (document.getElementById('use_vscode') as HTMLInputElement).checked;
  const useEclipse = (document.getElementById('use_eclipse') as HTMLInputElement).checked;
  const useIntellij = (document.getElementById('use_intellij') as HTMLInputElement).checked;

  const configDir = path.join(projectFolder, 'simulator_config');

  await makedir(toFolder);
  await makedir(configDir);

  // tslint:disable-next-line
  const wpilibLanguage = wpilibConfig.currentLanguage as string;

  // Get the resource paths to copy
  let resourceRoot = path.join(basepath, 'resources');
  if (basepath.indexOf('default_app.asar') >= 0) {
    resourceRoot = 'resources';
  }

  // Copy common things
  const snobotSimPluginConfig = path.join(resourceRoot, 'shared', 'SnobotSim.json');
  const snobotSimGuiConfig = path.join(resourceRoot, 'shared', 'simulator_config.yml');
  await copyFile(snobotSimGuiConfig, path.join(configDir, 'simulator_config.yml'));
  await copyFile(snobotSimPluginConfig, path.join(toFolder, 'SnobotSim.json'));

  if (wpilibLanguage === 'cpp') {
    const snobotSimGuiProperties = path.join(resourceRoot, 'cpp', 'simulator_config.properties');
    const snobotSimBuildScript = path.join(resourceRoot, 'cpp', 'snobot_sim.gradle');

    await copyFile(snobotSimGuiProperties, path.join(configDir, 'simulator_config.properties'));
    await copyFile(snobotSimBuildScript, path.join(toFolder, 'snobot_sim.gradle'));
  } else if (wpilibLanguage === 'java') {

    const snobotSimGuiProperties = path.join(resourceRoot, 'java', 'simulator_config.properties');

    const addCustomSimulator = (document.getElementById('enable_custom_sim') as HTMLInputElement).checked;
    let snobotSimBuildScript = '';
    if (addCustomSimulator) {
        snobotSimBuildScript = path.join(resourceRoot, 'java', 'snobot_sim_with_custom.gradle');
        const customSimulator = path.join(resourceRoot, 'java', 'custom_robot_simulator.java');
        const customSimSrcDr = path.join(projectFolder, 'src', 'custom_simulator', 'java', 'frc', 'robot');
        await makedir(customSimSrcDr);
        await copyFile(customSimulator, path.join(customSimSrcDr, 'CustomRobotSimulator.java'));

        let propertiesFileContents = await readFile(snobotSimGuiProperties);
        propertiesFileContents += '\nsimulator_class=frc.robot.CustomRobotSimulator';
        await writeFile(path.join(configDir, 'simulator_config.properties'), propertiesFileContents);

    } else {
        await copyFile(snobotSimGuiProperties, path.join(configDir, 'simulator_config.properties'));
        snobotSimBuildScript = path.join(resourceRoot, 'java', 'snobot_sim.gradle');
    }

    let snobotSimGradleFile = await readFile(snobotSimBuildScript);

    if (useEclipse) {
        const eclispeConfig = await readFile(path.join(resourceRoot, 'ide_files', 'eclipse', 'snobot_sim_addon.txt'));
        snobotSimGradleFile += eclispeConfig;

    }

    await writeFile(path.join(toFolder, 'snobot_sim.gradle'), snobotSimGradleFile);

    if (useVsCode) {
      alert('VS Code Not supported yet');
    }
    if (useIntellij) {
      const intellijFiles = path.join(resourceRoot, 'ide_files', 'intellij');
      await copyFile(intellijFiles, path.join(projectFolder, '.idea'));
    }
  }

  await updateBuildFile(projectFolder);
}
