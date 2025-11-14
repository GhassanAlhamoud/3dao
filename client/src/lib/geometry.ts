import * as THREE from 'three';

/**
 * Generate NACA 4-digit airfoil coordinates
 */
export function generateNACA4Airfoil(
  m: number, // max camber (0-9)
  p: number, // position of max camber (0-9)
  t: number, // thickness (00-99)
  numPoints: number = 50
): { x: number[]; y: number[] } {
  const M = m / 100;
  const P = p / 10;
  const T = t / 100;

  const x: number[] = [];
  const y: number[] = [];

  // Generate points using cosine spacing for better resolution at leading edge
  for (let i = 0; i <= numPoints; i++) {
    const beta = (i / numPoints) * Math.PI;
    const xi = (1 - Math.cos(beta)) / 2;

    // Thickness distribution
    const yt = 5 * T * (
      0.2969 * Math.sqrt(xi) -
      0.1260 * xi -
      0.3516 * xi * xi +
      0.2843 * xi * xi * xi -
      0.1015 * xi * xi * xi * xi
    );

    // Camber line
    let yc = 0;
    let dyc_dx = 0;
    if (xi < P && P > 0) {
      yc = (M / (P * P)) * (2 * P * xi - xi * xi);
      dyc_dx = (2 * M / (P * P)) * (P - xi);
    } else if (P > 0) {
      yc = (M / ((1 - P) * (1 - P))) * (1 - 2 * P + 2 * P * xi - xi * xi);
      dyc_dx = (2 * M / ((1 - P) * (1 - P))) * (P - xi);
    }

    const theta = Math.atan(dyc_dx);

    // Upper surface
    x.push(xi - yt * Math.sin(theta));
    y.push(yc + yt * Math.cos(theta));
  }

  // Lower surface (reverse order)
  for (let i = numPoints; i >= 0; i--) {
    const beta = (i / numPoints) * Math.PI;
    const xi = (1 - Math.cos(beta)) / 2;

    const yt = 5 * T * (
      0.2969 * Math.sqrt(xi) -
      0.1260 * xi -
      0.3516 * xi * xi +
      0.2843 * xi * xi * xi -
      0.1015 * xi * xi * xi * xi
    );

    let yc = 0;
    let dyc_dx = 0;
    if (xi < P && P > 0) {
      yc = (M / (P * P)) * (2 * P * xi - xi * xi);
      dyc_dx = (2 * M / (P * P)) * (P - xi);
    } else if (P > 0) {
      yc = (M / ((1 - P) * (1 - P))) * (1 - 2 * P + 2 * P * xi - xi * xi);
      dyc_dx = (2 * M / ((1 - P) * (1 - P))) * (P - xi);
    }

    const theta = Math.atan(dyc_dx);

    // Lower surface
    x.push(xi + yt * Math.sin(theta));
    y.push(yc - yt * Math.cos(theta));
  }

  return { x, y };
}

/**
 * Create 3D wing geometry from airfoil profile
 */
export function createWingGeometry(
  airfoilX: number[],
  airfoilY: number[],
  span: number,
  chord: number,
  segments: number = 20
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  // Create vertices
  for (let i = 0; i <= segments; i++) {
    const z = (i / segments - 0.5) * span;
    for (let j = 0; j < airfoilX.length; j++) {
      vertices.push(
        airfoilX[j] * chord,
        airfoilY[j] * chord,
        z
      );
    }
  }

  // Create faces
  const pointsPerSection = airfoilX.length;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < pointsPerSection - 1; j++) {
      const a = i * pointsPerSection + j;
      const b = a + pointsPerSection;
      const c = a + 1;
      const d = b + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Generate ogive (bullet) shape
 */
export function createOgiveGeometry(
  length: number,
  radius: number,
  segments: number = 32,
  rings: number = 32
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  // Ogive formula: rho = (R^2 + L^2) / (2*R)
  const rho = (radius * radius + length * length) / (2 * radius);

  for (let i = 0; i <= rings; i++) {
    const x = (i / rings) * length;
    const y = Math.sqrt(rho * rho - (length - x) * (length - x)) - (rho - radius);

    for (let j = 0; j <= segments; j++) {
      const theta = (j / segments) * Math.PI * 2;
      vertices.push(
        x,
        y * Math.cos(theta),
        y * Math.sin(theta)
      );
    }
  }

  // Create faces
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j;
      const b = a + segments + 1;
      const c = a + 1;
      const d = b + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Create Ahmed body geometry (simplified car model)
 */
export function createAhmedBodyGeometry(
  length: number = 1.044,
  width: number = 0.389,
  height: number = 0.288,
  slantAngle: number = 25 // degrees
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  const slantLength = 0.222; // Standard Ahmed body slant length
  const slantHeight = slantLength * Math.tan(slantAngle * Math.PI / 180);

  // Define key points
  const points = [
    // Front section (rounded)
    [0, 0, 0],
    [0.1, 0, 0],
    [0.2, height * 0.3, 0],
    [0.3, height * 0.7, 0],
    [0.338, height, 0],
    // Top flat section
    [length - slantLength, height, 0],
    // Slant section
    [length, height - slantHeight, 0],
    // Bottom
    [length, 0, 0],
  ];

  // Extrude profile to create 3D body
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const z = (i / segments - 0.5) * width;
    for (const [x, y] of points) {
      vertices.push(x, y, z);
    }
  }

  // Create faces
  const pointsPerSection = points.length;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < pointsPerSection - 1; j++) {
      const a = i * pointsPerSection + j;
      const b = a + pointsPerSection;
      const c = a + 1;
      const d = b + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  // Add end caps
  // Front cap
  for (let i = 1; i < pointsPerSection - 1; i++) {
    indices.push(0, i + 1, i);
  }
  // Back cap
  const backStart = segments * pointsPerSection;
  for (let i = 1; i < pointsPerSection - 1; i++) {
    indices.push(backStart, backStart + i, backStart + i + 1);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
