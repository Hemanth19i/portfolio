/**
 * Cross-component scene signals — plain mutable refs, read in useFrame
 * paths with zero allocation and zero React re-render. CameraRig owns the
 * writers; Stations / DocumentGlyph / Packets are readers.
 */
export const scroll = { progress: 0 };

/** Normalized pointer, -1..1, origin centre. Drives camera parallax. */
export const pointer = { x: 0, y: 0 };
