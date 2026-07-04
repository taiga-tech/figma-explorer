import { err, ok, type Result } from "../../utils/result"

export type FileId = string

export type FileIdSource = "figma_file_key" | "url_hash"

export type CreateFileIdValue = {
  fileId: FileId
  source: FileIdSource
}

export type CreateFileIdError = {
  kind: "missing_url" | "unsupported_url"
}

export type CreateFileIdResult = Result<CreateFileIdValue, CreateFileIdError>

// docs/architecture/data-model.md §3 の対象パスパターンと揃える。
const FILE_KEY_PATH_PATTERN =
  /^\/(?:file|design|board|slides|proto|site|buzz|make)\/([A-Za-z0-9]+)(?:\/|$)/

const FIGMA_HOSTNAME = "www.figma.com"

const extractFileKey = (url: URL): string | null => {
  if (url.hostname !== FIGMA_HOSTNAME) {
    return null
  }

  const match = FILE_KEY_PATH_PATTERN.exec(url.pathname)

  return match?.[1] ?? null
}

/**
 * hash fallback 用の正規化。タイトルスラッグ・クエリ・フラグメント・
 * 末尾スラッシュの変化で ID が変わらないようにする。
 */
const normalizeUrlForHash = (url: URL): string => {
  const keyMatch = FILE_KEY_PATH_PATTERN.exec(url.pathname)

  const pathname = keyMatch
    ? url.pathname.slice(0, keyMatch[0].replace(/\/$/, "").length)
    : url.pathname.replace(/\/+$/, "")

  return `${url.origin}${pathname}`
}

const hashText = (value: string): string => {
  // FNV-1a 32bit。ID 用途には衝突耐性より安定性と依存ゼロを優先する。
  let hash = 0x811c9dc5

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(16).padStart(8, "0")
}

export const createFileId = (
  url: string | null | undefined
): CreateFileIdResult => {
  const trimmedUrl = url?.trim()

  if (!trimmedUrl) {
    return err({ kind: "missing_url" })
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(trimmedUrl)
  } catch {
    return err({ kind: "unsupported_url" })
  }

  if (!/^https?:$/.test(parsedUrl.protocol)) {
    return err({ kind: "unsupported_url" })
  }

  const fileKey = extractFileKey(parsedUrl)

  if (fileKey) {
    return ok({ fileId: fileKey, source: "figma_file_key" })
  }

  return ok({
    fileId: `urlhash_${hashText(normalizeUrlForHash(parsedUrl))}`,
    source: "url_hash"
  })
}
