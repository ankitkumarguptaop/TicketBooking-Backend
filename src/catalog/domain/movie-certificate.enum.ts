/**
 * Indian CBFC certificates. Since 2024, UA is split by the age below which
 * parental guidance is advised (UA 7+, UA 13+, UA 16+).
 */
export enum MovieCertificate {
  /** Unrestricted. */
  U = 'U',
  UA_7 = 'UA_7',
  UA_13 = 'UA_13',
  UA_16 = 'UA_16',
  /** Adults only (18+). */
  A = 'A',
  /** Restricted to a specialised audience (e.g. doctors). */
  S = 'S',
}
