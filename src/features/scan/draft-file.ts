export type FigmaFileType = "design" | "figjam" | "slides" | "unknown"

export type FileScanStatus = "active" | "parse_error"

export type DraftFile = {
  id: string
  name: string
  url: string
  type: FigmaFileType
  updatedAtText?: string
  thumbnailUrl?: string
  firstSeenAt: string
  lastSeenAt: string
  scanStatus: FileScanStatus
}
