import * as THREE from 'three';

/**
 * Export Three.js geometry to STL format (ASCII)
 */
export function exportToSTL(geometry: THREE.BufferGeometry, filename: string = 'model.stl'): void {
  const stlString = generateSTLString(geometry);
  downloadSTL(stlString, filename);
}

/**
 * Generate STL string from geometry
 */
function generateSTLString(geometry: THREE.BufferGeometry): string {
  const vertices = geometry.attributes.position;
  const indices = geometry.index;

  if (!indices) {
    throw new Error('Geometry must have indices');
  }

  let stl = 'solid exported\n';

  for (let i = 0; i < indices.count; i += 3) {
    const i0 = indices.getX(i);
    const i1 = indices.getX(i + 1);
    const i2 = indices.getX(i + 2);

    const v0 = new THREE.Vector3(
      vertices.getX(i0),
      vertices.getY(i0),
      vertices.getZ(i0)
    );
    const v1 = new THREE.Vector3(
      vertices.getX(i1),
      vertices.getY(i1),
      vertices.getZ(i1)
    );
    const v2 = new THREE.Vector3(
      vertices.getX(i2),
      vertices.getY(i2),
      vertices.getZ(i2)
    );

    // Calculate normal
    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

    stl += `  facet normal ${normal.x.toExponential(6)} ${normal.y.toExponential(6)} ${normal.z.toExponential(6)}\n`;
    stl += '    outer loop\n';
    stl += `      vertex ${v0.x.toExponential(6)} ${v0.y.toExponential(6)} ${v0.z.toExponential(6)}\n`;
    stl += `      vertex ${v1.x.toExponential(6)} ${v1.y.toExponential(6)} ${v1.z.toExponential(6)}\n`;
    stl += `      vertex ${v2.x.toExponential(6)} ${v2.y.toExponential(6)} ${v2.z.toExponential(6)}\n`;
    stl += '    endloop\n';
    stl += '  endfacet\n';
  }

  stl += 'endsolid exported\n';

  return stl;
}

/**
 * Trigger download of STL file
 */
function downloadSTL(stlString: string, filename: string): void {
  const blob = new Blob([stlString], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export session data to JSON
 */
export function exportSession(data: {
  scenario: string;
  generation: number;
  bestFitness: number;
  genes: any[];
  fitnessHistory: number[];
}): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `3dao-session-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import session data from JSON
 */
export function importSession(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
