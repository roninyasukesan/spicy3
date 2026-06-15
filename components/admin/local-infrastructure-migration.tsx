"use client"

import { useEffect, useState } from "react"
import { Database, LoaderCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getLocalMigrationSnapshot,
  migrateLocalInfrastructure,
  type LocalMigrationReport,
  type LocalMigrationSnapshot,
} from "@/lib/local-infrastructure-migration"

const EMPTY_SNAPSHOT: LocalMigrationSnapshot = {
  users: 0,
  profiles: 0,
  photos: 0,
  stories: 0,
  videos: 0,
  audio: 0,
  pendingMedia: 0,
}

export function LocalInfrastructureMigration() {
  const [snapshot, setSnapshot] =
    useState<LocalMigrationSnapshot>(EMPTY_SNAPSHOT)
  const [report, setReport] = useState<LocalMigrationReport | null>(null)
  const [progress, setProgress] = useState("")
  const [running, setRunning] = useState(false)

  const refresh = () => setSnapshot(getLocalMigrationSnapshot())

  useEffect(() => {
    refresh()
  }, [])

  const runMigration = async () => {
    setRunning(true)
    setReport(null)
    setProgress("Preparando migração...")

    try {
      const result = await migrateLocalInfrastructure(setProgress)
      setReport(result)
      refresh()
    } catch (error) {
      setReport({
        ...snapshot,
        createdUsers: 0,
        linkedUsers: 0,
        migratedProfiles: 0,
        migratedMedia: 0,
        migratedPhotos: 0,
        migratedVideos: 0,
        errors: [
          error instanceof Error ? error.message : "Falha ao iniciar a migração.",
        ],
      })
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card className="bg-dark-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Database className="h-5 w-5 text-primary" />
          Migrar armazenamento local
        </CardTitle>
        <CardDescription className="text-gray-400">
          Associa usuários por e-mail, grava perfis no Supabase e envia fotos,
          stories, vídeos e áudio para o Google Drive. Antes da substituição
          por URLs remotas, os originais são preservados em um backup local.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-7">
          <Metric label="Usuários" value={snapshot.users} />
          <Metric label="Perfis" value={snapshot.profiles} />
          <Metric label="Fotos" value={snapshot.photos} />
          <Metric label="Stories" value={snapshot.stories} />
          <Metric label="Vídeos" value={snapshot.videos} />
          <Metric label="Áudios" value={snapshot.audio} />
          <Metric label="Pendentes" value={snapshot.pendingMedia} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => void runMigration()}
            disabled={running || snapshot.profiles === 0}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {running && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {running ? "Migrando..." : "Migrar para Supabase e Drive"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={refresh}
            disabled={running}
            className="border-gray-700 text-gray-300"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Recontar dados locais
          </Button>
        </div>

        {progress && <p className="text-sm text-gray-300">{progress}</p>}

        {report && (
          <div className="space-y-2 rounded-lg border border-gray-700 bg-dark-800 p-4 text-sm text-gray-300">
            <p>
              {report.createdUsers} usuários criados, {report.linkedUsers} já
              vinculados, {report.migratedProfiles} perfis e{" "}
              {report.migratedMedia} mídias locais migradas.
            </p>
            <p>
              {report.migratedPhotos} fotos e {report.migratedVideos} vídeos
              enviados nesta execução.
            </p>
            {report.errors.map((error) => (
              <p key={error} className="text-red-300">
                {error}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-dark-800 p-3">
      <p className="text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  )
}
