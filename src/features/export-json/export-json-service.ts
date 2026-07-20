import type { ExportJson } from "../../domain/export-json"
import type { PersistentState } from "../../domain/organizer-state"
import { createOrganizerError, err, ok, type Result } from "../../utils/result"
import type { DraftFile } from "../scan/draft-file"

export type ExportJsonInput = {
  appVersion: string
  exportedAt: string
  files: readonly DraftFile[]
  state: PersistentState
}

export type ExportJsonArtifact = {
  data: ExportJson
  fileName: string
  json: string
}

export type JsonDownloadAdapter = {
  createObjectUrl: (blob: Blob) => string
  revokeObjectUrl: (url: string) => void
  clickDownload: (url: string, fileName: string) => void
}

type ScannedFile = Pick<DraftFile, "id" | "name" | "url">

const compareById = <T extends { id: string }>(left: T, right: T) =>
  left.id.localeCompare(right.id)

const createExportJson = ({
  appVersion,
  exportedAt,
  files,
  state
}: ExportJsonInput): ExportJson => ({
  exportedAt,
  appVersion,
  schemaVersion: state.schemaVersion,
  files: [...files],
  folders: Object.values(state.folders).sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || compareById(left, right)
  ),
  folderTree: state.folderTree,
  assignments: Object.values(state.assignments).sort((left, right) =>
    left.fileId.localeCompare(right.fileId)
  ),
  settings: state.settings
})

const inferFigmaFileType = (url: string): DraftFile["type"] => {
  try {
    const route = new URL(url).pathname.split("/").filter(Boolean)[0]

    if (route === "board") {
      return "figjam"
    }

    if (route === "slides") {
      return "slides"
    }

    if (
      route === "file" ||
      route === "design" ||
      route === "proto" ||
      route === "site" ||
      route === "buzz" ||
      route === "make"
    ) {
      return "design"
    }
  } catch {
    return "unknown"
  }

  return "unknown"
}

export const createExportDraftFiles = (
  files: readonly ScannedFile[],
  observedAt: string
): DraftFile[] =>
  files.map((file) => ({
    id: file.id,
    name: file.name,
    url: file.url,
    type: inferFigmaFileType(file.url),
    firstSeenAt: observedAt,
    lastSeenAt: observedAt,
    scanStatus: "active"
  }))

export const createExportFileName = (exportedAt: string): string =>
  `figma-explorer-${exportedAt.replace(/[:.]/g, "-")}.json`

export const createExportJsonArtifact = (
  input: ExportJsonInput
): Result<ExportJsonArtifact> => {
  try {
    const data = createExportJson(input)

    return ok({
      data,
      fileName: createExportFileName(input.exportedAt),
      json: `${JSON.stringify(data, null, 2)}\n`
    })
  } catch (cause) {
    return err(
      createOrganizerError(
        "export_failed",
        "Failed to generate the organizer JSON export.",
        cause
      )
    )
  }
}

const browserDownloadAdapter: JsonDownloadAdapter = {
  createObjectUrl: (blob) => URL.createObjectURL(blob),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
  clickDownload: (url, fileName) => {
    const link = document.createElement("a")

    link.href = url
    link.download = fileName
    link.hidden = true
    document.body.append(link)

    try {
      link.click()
    } finally {
      link.remove()
    }
  }
}

export const downloadExportJson = (
  artifact: Pick<ExportJsonArtifact, "fileName" | "json">,
  adapter: JsonDownloadAdapter = browserDownloadAdapter
): Result<void> => {
  let objectUrl: string | null = null
  let result: Result<void> = ok(undefined)

  try {
    objectUrl = adapter.createObjectUrl(
      new Blob([artifact.json], { type: "application/json;charset=utf-8" })
    )
    adapter.clickDownload(objectUrl, artifact.fileName)
  } catch (cause) {
    result = err(
      createOrganizerError(
        "export_failed",
        "Failed to download the organizer JSON export.",
        cause
      )
    )
  }

  if (objectUrl !== null) {
    try {
      adapter.revokeObjectUrl(objectUrl)
    } catch (cause) {
      if (result.ok) {
        result = err(
          createOrganizerError(
            "export_failed",
            "Failed to release the organizer JSON download URL.",
            cause
          )
        )
      }
    }
  }

  return result
}
