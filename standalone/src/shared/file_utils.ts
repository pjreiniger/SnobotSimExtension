
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as ncp from 'ncp';

export function copyFile(source: string, dest: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      ncp.ncp(source, dest, {}, (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
}

export function writeFile(filename: string, contents: string): Promise<void> {
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

export function makedir(directory: string): Promise<void> {
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

export function readFile(filename: string): Promise<string> {
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

export function exists(filename: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    fs.exists(filename, (e) => {
      resolve(e);
    });
  });
}
