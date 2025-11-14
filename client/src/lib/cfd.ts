import * as THREE from 'three';

export interface CFDResult {
  drag: number;
  lift: number;
  pressureCoefficients: number[];
  velocities: THREE.Vector3[];
}

/**
 * Simple 3D panel method CFD solver
 * Uses vortex lattice method approximation for lifting surfaces
 */
export class PanelMethodSolver {
  private freestream: THREE.Vector3;
  private density: number;
  private reynoldsNumber: number;

  constructor(
    velocity: number = 1.0,
    angleOfAttack: number = 0,
    density: number = 1.225,
    reynoldsNumber: number = 1e6
  ) {
    // Convert angle of attack to radians and create freestream velocity vector
    const alpha = angleOfAttack * Math.PI / 180;
    this.freestream = new THREE.Vector3(
      velocity * Math.cos(alpha),
      velocity * Math.sin(alpha),
      0
    );
    this.density = density;
    this.reynoldsNumber = reynoldsNumber;
  }

  /**
   * Solve for aerodynamic forces on geometry
   */
  solve(geometry: THREE.BufferGeometry): CFDResult {
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const numVertices = positions.count;

    // Calculate panel centers and areas
    const panels: { center: THREE.Vector3; normal: THREE.Vector3; area: number }[] = [];
    
    if (geometry.index) {
      const indices = geometry.index.array;
      for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];

        const v0 = new THREE.Vector3(positions.getX(i0), positions.getY(i0), positions.getZ(i0));
        const v1 = new THREE.Vector3(positions.getX(i1), positions.getY(i1), positions.getZ(i1));
        const v2 = new THREE.Vector3(positions.getX(i2), positions.getY(i2), positions.getZ(i2));

        const center = new THREE.Vector3()
          .add(v0)
          .add(v1)
          .add(v2)
          .divideScalar(3);

        const edge1 = new THREE.Vector3().subVectors(v1, v0);
        const edge2 = new THREE.Vector3().subVectors(v2, v0);
        const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
        const area = edge1.cross(edge2).length() / 2;

        panels.push({ center, normal, area });
      }
    }

    // Calculate pressure coefficients using simplified potential flow
    const pressureCoefficients: number[] = new Array(numVertices).fill(0);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < numVertices; i++) {
      const point = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      const normal = new THREE.Vector3(
        normals.getX(i),
        normals.getY(i),
        normals.getZ(i)
      );

      // Calculate induced velocity (simplified)
      let inducedVelocity = new THREE.Vector3();
      
      // Find nearest panels and calculate influence
      for (const panel of panels) {
        const r = new THREE.Vector3().subVectors(point, panel.center);
        const distance = r.length();
        
        if (distance > 0.001) {
          // Simplified vortex influence
          const strength = this.freestream.dot(panel.normal) * panel.area;
          const influence = new THREE.Vector3()
            .crossVectors(panel.normal, r)
            .multiplyScalar(strength / (distance * distance * distance));
          inducedVelocity.add(influence);
        }
      }

      // Total velocity
      const totalVelocity = new THREE.Vector3()
        .copy(this.freestream)
        .add(inducedVelocity);
      
      velocities.push(totalVelocity);

      // Pressure coefficient: Cp = 1 - (V/V_inf)^2
      const velocityRatio = totalVelocity.length() / this.freestream.length();
      const Cp = 1 - velocityRatio * velocityRatio;
      pressureCoefficients[i] = Cp;
    }

    // Calculate forces
    let dragForce = 0;
    let liftForce = 0;

    for (const panel of panels) {
      // Find average Cp for this panel
      let avgCp = 0;
      let count = 0;
      
      if (geometry.index) {
        const indices = geometry.index.array;
        for (let i = 0; i < indices.length; i += 3) {
          const i0 = indices[i];
          const i1 = indices[i + 1];
          const i2 = indices[i + 2];
          
          const v0 = new THREE.Vector3(positions.getX(i0), positions.getY(i0), positions.getZ(i0));
          const center = new THREE.Vector3()
            .add(v0)
            .add(new THREE.Vector3(positions.getX(i1), positions.getY(i1), positions.getZ(i1)))
            .add(new THREE.Vector3(positions.getX(i2), positions.getY(i2), positions.getZ(i2)))
            .divideScalar(3);
          
          if (center.distanceTo(panel.center) < 0.001) {
            avgCp = (pressureCoefficients[i0] + pressureCoefficients[i1] + pressureCoefficients[i2]) / 3;
            count++;
            break;
          }
        }
      }

      if (count > 0) {
        // Force = Cp * q * Area * normal
        const dynamicPressure = 0.5 * this.density * this.freestream.lengthSq();
        const force = new THREE.Vector3()
          .copy(panel.normal)
          .multiplyScalar(-avgCp * dynamicPressure * panel.area);

        // Project onto drag and lift directions
        const dragDir = new THREE.Vector3().copy(this.freestream).normalize();
        const liftDir = new THREE.Vector3(0, 1, 0);

        dragForce += force.dot(dragDir);
        liftForce += force.dot(liftDir);
      }
    }

    return {
      drag: dragForce,
      lift: liftForce,
      pressureCoefficients,
      velocities
    };
  }

  /**
   * Calculate drag coefficient
   */
  calculateDragCoefficient(geometry: THREE.BufferGeometry, referenceArea: number): number {
    const result = this.solve(geometry);
    const dynamicPressure = 0.5 * this.density * this.freestream.lengthSq();
    return result.drag / (dynamicPressure * referenceArea);
  }

  /**
   * Calculate lift coefficient
   */
  calculateLiftCoefficient(geometry: THREE.BufferGeometry, referenceArea: number): number {
    const result = this.solve(geometry);
    const dynamicPressure = 0.5 * this.density * this.freestream.lengthSq();
    return result.lift / (dynamicPressure * referenceArea);
  }
}
