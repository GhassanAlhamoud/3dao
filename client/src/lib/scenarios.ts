import { Gene, Constraint } from './genetic';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  baseGeometry: string;
  optimizationGoal: string;
  genes: Gene[];
  constraints: Omit<Constraint, 'evaluate'>[];
  flowConditions: {
    velocity: number;
    angleOfAttack: number;
    reynoldsNumber: number;
  };
}

export const scenarios: Scenario[] = [
  {
    id: 'bullet-train',
    name: 'High-Speed Bullet Train Nose',
    description: 'Optimize the nose shape of a high-speed train to minimize drag at Mach 0.3',
    baseGeometry: 'ogive',
    optimizationGoal: 'Minimize drag coefficient',
    genes: [
      { name: 'length', value: 8.0, min: 5.0, max: 12.0 },
      { name: 'radius', value: 1.5, min: 1.0, max: 2.0 },
      { name: 'fineness', value: 0.7, min: 0.5, max: 0.9 }
    ],
    constraints: [
      { name: 'Max Length', type: 'max', value: 10.0, penalty: 100 },
      { name: 'Min Radius', type: 'min', value: 1.2, penalty: 100 }
    ],
    flowConditions: {
      velocity: 100,
      angleOfAttack: 0,
      reynoldsNumber: 1e7
    }
  },
  {
    id: 'f1-wing',
    name: 'F1 Rear Wing Endplate',
    description: 'Maximize outwash (side-force) for a given drag penalty within FIA regulations',
    baseGeometry: 'naca',
    optimizationGoal: 'Maximize L/D ratio',
    genes: [
      { name: 'camber', value: 4, min: 0, max: 9 },
      { name: 'camberPos', value: 4, min: 0, max: 9 },
      { name: 'thickness', value: 15, min: 8, max: 20 },
      { name: 'chord', value: 0.3, min: 0.2, max: 0.4 },
      { name: 'span', value: 0.5, min: 0.3, max: 0.6 }
    ],
    constraints: [
      { name: 'Max Height', type: 'max', value: 0.95, penalty: 1000 },
      { name: 'Max Width', type: 'max', value: 0.4, penalty: 1000 },
      { name: 'Max Chord', type: 'max', value: 0.35, penalty: 1000 }
    ],
    flowConditions: {
      velocity: 50,
      angleOfAttack: 15,
      reynoldsNumber: 5e5
    }
  },
  {
    id: 'bicycle-frame',
    name: 'Low-Drag Bicycle Frame',
    description: 'Minimize drag at 30 mph with 10° yaw angle while maintaining structural stiffness',
    baseGeometry: 'naca',
    optimizationGoal: 'Minimize drag coefficient',
    genes: [
      { name: 'camber', value: 0, min: 0, max: 2 },
      { name: 'camberPos', value: 5, min: 3, max: 7 },
      { name: 'thickness', value: 25, min: 15, max: 35 },
      { name: 'aspectRatio', value: 2.5, min: 2.0, max: 4.0 }
    ],
    constraints: [
      { name: 'Min Thickness', type: 'min', value: 0.02, penalty: 500 }
    ],
    flowConditions: {
      velocity: 13.4,
      angleOfAttack: 10,
      reynoldsNumber: 1e5
    }
  },
  {
    id: 'drone-propeller',
    name: 'Silent Drone Propeller',
    description: 'Minimize aero-acoustic noise signature while maintaining required thrust',
    baseGeometry: 'naca',
    optimizationGoal: 'Maximize efficiency, minimize noise',
    genes: [
      { name: 'camber', value: 4, min: 2, max: 6 },
      { name: 'camberPos', value: 4, min: 3, max: 6 },
      { name: 'thickness', value: 12, min: 8, max: 16 },
      { name: 'chord', value: 0.05, min: 0.03, max: 0.08 },
      { name: 'twist', value: 15, min: 5, max: 25 }
    ],
    constraints: [
      { name: 'Max Diameter', type: 'max', value: 0.3, penalty: 1000 },
      { name: 'Min Thrust', type: 'min', value: 2.0, penalty: 500 }
    ],
    flowConditions: {
      velocity: 20,
      angleOfAttack: 8,
      reynoldsNumber: 5e4
    }
  },
  {
    id: 'venturi-duct',
    name: 'Venturi Effect Cooling Duct',
    description: 'Maximize mass flow rate for a given pressure drop',
    baseGeometry: 'ogive',
    optimizationGoal: 'Maximize flow rate',
    genes: [
      { name: 'inletDiameter', value: 0.1, min: 0.08, max: 0.15 },
      { name: 'throatDiameter', value: 0.05, min: 0.03, max: 0.08 },
      { name: 'outletDiameter', value: 0.1, min: 0.08, max: 0.15 },
      { name: 'length', value: 0.3, min: 0.2, max: 0.5 }
    ],
    constraints: [
      { name: 'Max Length', type: 'max', value: 0.4, penalty: 200 }
    ],
    flowConditions: {
      velocity: 10,
      angleOfAttack: 0,
      reynoldsNumber: 1e5
    }
  },
  {
    id: 'uav-wing',
    name: 'Endurance UAV Wing',
    description: 'Maximize L/D at cruise Reynolds number for long endurance flight',
    baseGeometry: 'naca',
    optimizationGoal: 'Maximize L/D ratio',
    genes: [
      { name: 'camber', value: 4, min: 2, max: 6 },
      { name: 'camberPos', value: 4, min: 3, max: 6 },
      { name: 'thickness', value: 12, min: 9, max: 18 },
      { name: 'chord', value: 0.2, min: 0.15, max: 0.3 },
      { name: 'span', value: 2.0, min: 1.5, max: 3.0 }
    ],
    constraints: [
      { name: 'Min Thickness', type: 'min', value: 0.02, penalty: 500 },
      { name: 'Max Wingspan', type: 'max', value: 2.5, penalty: 1000 }
    ],
    flowConditions: {
      velocity: 15,
      angleOfAttack: 4,
      reynoldsNumber: 2e5
    }
  },
  {
    id: 'car-spoiler',
    name: 'Downforce-Generating Car Spoiler',
    description: 'Maximize downforce with a drag coefficient cap',
    baseGeometry: 'naca',
    optimizationGoal: 'Maximize downforce',
    genes: [
      { name: 'camber', value: 4, min: 0, max: 9 },
      { name: 'camberPos', value: 4, min: 2, max: 7 },
      { name: 'thickness', value: 12, min: 8, max: 18 },
      { name: 'chord', value: 0.4, min: 0.25, max: 0.6 },
      { name: 'angle', value: -15, min: -25, max: -5 }
    ],
    constraints: [
      { name: 'Max Height', type: 'max', value: 0.5, penalty: 1000 },
      { name: 'Max Drag Coeff', type: 'max', value: 0.5, penalty: 500 }
    ],
    flowConditions: {
      velocity: 40,
      angleOfAttack: -15,
      reynoldsNumber: 1e6
    }
  },
  {
    id: 'wind-turbine',
    name: 'Wind Turbine Blade Section',
    description: 'Maximize power coefficient at a specific tip-speed ratio',
    baseGeometry: 'naca',
    optimizationGoal: 'Maximize power coefficient',
    genes: [
      { name: 'camber', value: 4, min: 2, max: 6 },
      { name: 'camberPos', value: 4, min: 3, max: 6 },
      { name: 'thickness', value: 18, min: 12, max: 25 },
      { name: 'chord', value: 1.0, min: 0.6, max: 1.5 },
      { name: 'twist', value: 8, min: 0, max: 15 }
    ],
    constraints: [
      { name: 'Max Chord', type: 'max', value: 1.2, penalty: 500 },
      { name: 'Min Thickness', type: 'min', value: 0.15, penalty: 500 }
    ],
    flowConditions: {
      velocity: 12,
      angleOfAttack: 8,
      reynoldsNumber: 5e5
    }
  },
  {
    id: 'hydrofoil',
    name: 'Hydrofoil for Racing Yacht',
    description: 'Minimize drag at a given lift coefficient while avoiding cavitation',
    baseGeometry: 'naca',
    optimizationGoal: 'Minimize drag at CL=0.8',
    genes: [
      { name: 'camber', value: 4, min: 2, max: 6 },
      { name: 'camberPos', value: 5, min: 3, max: 7 },
      { name: 'thickness', value: 12, min: 8, max: 16 },
      { name: 'chord', value: 0.5, min: 0.3, max: 0.8 },
      { name: 'span', value: 1.5, min: 1.0, max: 2.0 }
    ],
    constraints: [
      { name: 'Min Pressure Coeff', type: 'min', value: -1.5, penalty: 1000 }
    ],
    flowConditions: {
      velocity: 10,
      angleOfAttack: 6,
      reynoldsNumber: 3e6
    }
  },
  {
    id: 'ahmed-body',
    name: 'Ahmed Body Optimization',
    description: 'Minimize drag by optimizing rear slant angle and edge radii',
    baseGeometry: 'ahmed',
    optimizationGoal: 'Minimize drag coefficient',
    genes: [
      { name: 'slantAngle', value: 25, min: 0, max: 40 },
      { name: 'edgeRadius', value: 0.01, min: 0.005, max: 0.03 },
      { name: 'rearHeight', value: 0.288, min: 0.25, max: 0.32 }
    ],
    constraints: [
      { name: 'Fixed Length', type: 'equal', value: 1.044, penalty: 1000 },
      { name: 'Fixed Width', type: 'equal', value: 0.389, penalty: 1000 }
    ],
    flowConditions: {
      velocity: 40,
      angleOfAttack: 0,
      reynoldsNumber: 2e6
    }
  }
];
