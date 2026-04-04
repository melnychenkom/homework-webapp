import { useEffect, useRef, useState } from 'react'
import { PluginContext } from 'molstar/lib/mol-plugin/context'
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec'
import { PluginCommands } from 'molstar/lib/mol-plugin/commands'
import { Color } from 'molstar/lib/mol-util/color'

interface PocketMapping {
  label: string
  mol2: string
  original_ids: string[]
  residues: string[]
}

export interface JobFiles {
  protein_pdb: string | null
  pocket_mol2s: string[]
  residue_pdbs: string[]
  mapping: PocketMapping[] | null
}

interface Props {
  jobId: string
  files: JobFiles
  height?: number
}

interface PocketLayer {
  label: string
  mol2Ref: string | null
  residueRefs: string[]
  mol2Visible: boolean
  residueVisible: boolean
}

const POCKET_COLORS = [0x4488ff, 0xff6633, 0x44cc44, 0xcc44cc, 0xffcc00, 0x00cccc]

type Status = 'loading' | 'ready' | 'error'

function hexColor(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`
}

export default function MolstarViewer({ jobId, files, height = 520 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pluginRef = useRef<PluginContext | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [layers, setLayers] = useState<PocketLayer[]>([])

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current

    async function init() {
      try {
        const plugin = new PluginContext(DefaultPluginSpec())
        await plugin.init()
        await plugin.mountAsync(el)
        pluginRef.current = plugin

        if (files.protein_pdb) {
          const url = `/jobs/${jobId}/files/${files.protein_pdb}/`
          const data = await plugin.builders.data.download({ url, isBinary: false })
          const traj = await plugin.builders.structure.parseTrajectory(data, 'pdb')
          const model = await plugin.builders.structure.createModel(traj)
          const struct = await plugin.builders.structure.createStructure(model)
          const polymerComp = await plugin.builders.structure.tryCreateComponentStatic(struct, 'polymer', { label: 'Protein' })
          if (polymerComp) {
            await plugin.builders.structure.representation.addRepresentation(polymerComp, {
              type: 'cartoon',
              color: 'chain-id',
            })
          }
        }

        // Derive entries from mapping if available, otherwise fall back to index-based pairing
        const entries: PocketMapping[] = files.mapping ?? files.pocket_mol2s.map((mol2, i) => ({
          label: `Pocket ${i}`,
          mol2,
          original_ids: [],
          residues: files.residue_pdbs[i] ? [files.residue_pdbs[i]] : [],
        }))

        const newLayers: PocketLayer[] = []

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i]
          const color = POCKET_COLORS[i % POCKET_COLORS.length]

          let mol2Ref: string | null = null
          const residueRefs: string[] = []

          // mol2 grid points — disabled, uncomment to enable
          // try {
          //   const mol2Url = `/jobs/${jobId}/files/${entry.mol2}/`
          //   const mol2Data = await plugin.builders.data.download({ url: mol2Url, isBinary: false })
          //   const mol2Traj = await plugin.builders.structure.parseTrajectory(mol2Data, 'mol2')
          //   const mol2Model = await plugin.builders.structure.createModel(mol2Traj)
          //   const mol2Struct = await plugin.builders.structure.createStructure(mol2Model)
          //   const mol2Comp = await plugin.builders.structure.tryCreateComponentStatic(mol2Struct, 'all', { label: `${entry.label} vol` })
          //   if (mol2Comp) {
          //     await plugin.builders.structure.representation.addRepresentation(mol2Comp, {
          //       type: 'point',
          //       color: 'uniform',
          //       colorParams: { value: Color(color) },
          //       typeParams: { sizeFactor: 0.4 },
          //     })
          //     mol2Ref = mol2Model.ref
          //   }
          // } catch {}

          for (const residuePath of entry.residues) {
            try {
              const resUrl = `/jobs/${jobId}/files/${residuePath}/`
              const resData = await plugin.builders.data.download({ url: resUrl, isBinary: false })
              const resTraj = await plugin.builders.structure.parseTrajectory(resData, 'pdb')
              const resModel = await plugin.builders.structure.createModel(resTraj)
              const resStruct = await plugin.builders.structure.createStructure(resModel)
              const resComp = await plugin.builders.structure.tryCreateComponentStatic(resStruct, 'all', { label: `${entry.label} res` })
              if (resComp) {
                await plugin.builders.structure.representation.addRepresentation(resComp, {
                  type: 'ball-and-stick',
                  color: 'uniform',
                  colorParams: { value: Color(color) },
                })
                residueRefs.push(resModel.ref)
              }
            } catch {}
          }

          newLayers.push({ label: entry.label, mol2Ref, residueRefs, mol2Visible: true, residueVisible: true })
        }

        setLayers(newLayers)
        setStatus('ready')
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load viewer')
        setStatus('error')
      }
    }

    void init()

    return () => {
      pluginRef.current?.dispose()
      pluginRef.current = null
    }
  }, [jobId, files])

  async function handleToggle(i: number, kind: 'mol2' | 'residue') {
    const plugin = pluginRef.current
    if (!plugin) return

    if (kind === 'mol2') {
      const ref = layers[i].mol2Ref
      if (!ref) return
      await PluginCommands.State.ToggleVisibility(plugin, { state: plugin.state.data, ref })
      setLayers(prev => prev.map((l, idx) => idx !== i ? l : { ...l, mol2Visible: !l.mol2Visible }))
    } else {
      for (const ref of layers[i].residueRefs) {
        await PluginCommands.State.ToggleVisibility(plugin, { state: plugin.state.data, ref })
      }
      setLayers(prev => prev.map((l, idx) => idx !== i ? l : { ...l, residueVisible: !l.residueVisible }))
    }
  }

  return (
    <div>
      <div
        ref={containerRef}
        style={{ position: 'relative', height, width: '100%', borderRadius: '.375rem', overflow: 'hidden', background: '#1a1a2e' }}
      />

      {status === 'loading' && (
        <p className="text-muted small mt-2 mb-0">Loading viewer…</p>
      )}

      {status === 'error' && (
        <p className="text-danger small mt-2 mb-0">{errorMsg}</p>
      )}

      {status === 'ready' && layers.length > 0 && (
        <div className="mt-2 d-flex flex-wrap gap-2">
          {layers.map((layer, i) => {
            const color = hexColor(POCKET_COLORS[i % POCKET_COLORS.length])
            return (
              <div key={i} className="d-flex align-items-center gap-2 border rounded px-2 py-1 small">
                <span
                  style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }}
                />
                <span className="fw-semibold">{layer.label}</span>
                {layer.mol2Ref && (
                  <label className="d-flex align-items-center gap-1 mb-0 user-select-none" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      className="form-check-input mt-0"
                      checked={layer.mol2Visible}
                      onChange={() => void handleToggle(i, 'mol2')}
                    />
                    Volume
                  </label>
                )}
                {layer.residueRefs.length > 0 && (
                  <label className="d-flex align-items-center gap-1 mb-0 user-select-none" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      className="form-check-input mt-0"
                      checked={layer.residueVisible}
                      onChange={() => void handleToggle(i, 'residue')}
                    />
                    Residues
                  </label>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
