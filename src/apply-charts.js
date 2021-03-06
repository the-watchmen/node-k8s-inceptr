import fs from 'fs'
import assert from 'assert'
import config from 'config'
import yn from 'yn'
import debug from '@watchmen/debug'
import {exec} from './helper'
import {getSecretArgs} from './secrets'

const dbg = debug(__filename)

export default function({namespace, charts}) {
  dbg('args=%o', arguments)
  if (!charts) return

  exec('helm init --client-only')
  exec('helm repo update')

  for (const chart of charts) {
    const {name, discriminator, version, valuesFile, release, secrets, wait} = chart
    assert(name)
    assert(version)

    // exec(
    //   `helm fetch \
    //     --untar \
    //     --untardir ${chartsRoot} \
    //     ${version ? `--version '${version}'` : ''} \
    //     ${name}`
    // )

    // exec(
    //   `helm template \
    //     ${getArgs({flag: 'values', args: valueFiles})} \
    //     --name ${release || namespace} \
    //     --namespace ${namespace} \
    //     ${getKeyValueArgs({flag: 'set', args: setArgs})} \
    //     ${chartRoot} \
    //     > ${specs}`
    // )

    const {helm} = config
    const repo = chart.repo || helm.repo
    const isRepo = repo.startsWith('https://')
    const suffix = discriminator ? `-${discriminator}` : ''
    const _name = `${name}${suffix}`
    const values = valuesFile || `${config.root}/${config.values.root}/${_name}.yaml`
    const areValues = fs.existsSync(values)

    dbg('name=%o, values=%o', name, values)

    exec(
      `${helm.command} upgrade
      --install
      ${yn(config.force) ? '--force' : ''}
      ${yn(wait || config.wait) ? '--wait' : ''}
      ${yn(config.dryRun) ? '--dry-run' : ''}
      ${isRepo ? `--repo ${repo}` : ''}
      --version ${version}
      ${areValues ? `--values ${values}` : ''}
      ${getSecretArgs({name, secrets, strategy: config.strategy})}
      --tiller-namespace ${namespace}
      --namespace ${namespace}
      ${release || _name}
      ${isRepo ? name : repo}`
    )
  }
}
