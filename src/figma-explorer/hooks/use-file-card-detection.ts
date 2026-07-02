import { useSyncExternalStore } from "react"

import {
  getFileCardDetectionSnapshot,
  subscribeToFileCardDetection
} from "../stores/file-card-detection-store"

export const useFileCardDetection = () =>
  useSyncExternalStore(
    subscribeToFileCardDetection,
    getFileCardDetectionSnapshot,
    getFileCardDetectionSnapshot
  )
