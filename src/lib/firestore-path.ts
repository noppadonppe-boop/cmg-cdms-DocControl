/**
 * Central Firestore path helper
 * Structure: CMG-cdms-DocControl (collection) > root (document) > {subcollection}
 *
 * All reads/writes go through these helpers so changing the path only requires
 * editing this file.
 */

export const ROOT_COL = 'CMG-cdms-DocControl'
export const ROOT_DOC = 'root'

/** Returns a CollectionReference path string for use with collection(db, ...) */
export function subCol(name: string) {
  return `${ROOT_COL}/${ROOT_DOC}/${name}` as const
}
