import { chain, Tree, noop, TaskId } from '@angular-devkit/schematics';
import {
  addUpdateTask,
  readJsonInTree,
  formatFiles,
  updateJsonInTree
} from '@nrwl/workspace';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { gt } from 'semver';

const updateAngular = addUpdateTask('@angular/core', '8.2.4');

function updateCLI() {
  const tasks: TaskId[] = [];
  const rule = chain([
    updateJsonInTree('package.json', json => {
      json.devDependencies = json.devDependencies || {};
      const cliVersion = json.devDependencies['@angular/cli'];

      if (cliVersion && gt(cliVersion, '8.3.3')) {
        return json;
      }

      if (json['devDependencies']['@angular/cli']) {
        json['devDependencies']['@angular/cli'] = '8.3.3';
      }

      if (json['devDependencies']['@angular-devkit/build-angular']) {
        json['devDependencies']['@angular-devkit/build-angular'] = '^0.803.3';
      }

      if (json['devDependencies']['@angular-devkit/build-ng-packagr']) {
        json['devDependencies']['@angular-devkit/build-ng-packagr'] =
          '~0.803.3';
      }

      return json;
    }),
    (host, context) => {
      tasks.push(context.addTask(new NodePackageInstallTask()));
    }
  ]);

  return { rule, tasks };
}

function updateNgrx(updateDeps: TaskId[]) {
  return (host: Tree) => {
    const { dependencies } = readJsonInTree(host, 'package.json');

    if (dependencies && dependencies['@ngrx/store']) {
      return chain([
        addUpdateTask('@ngrx/store', '8.3.0', updateDeps),
        formatFiles()
      ]);
    }

    return noop();
  };
}

export default function() {
  const { rule: updateCLIRule, tasks } = updateCLI();
  return chain([updateAngular, updateCLIRule, updateNgrx(tasks)]);
}
