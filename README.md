# 3D Aerodynamic Optimizer (3DAO)

**Version 1.0 – 15 Nov 2025**

A browser-based tool for evolving manufacturable 3D geometries toward minimum aerodynamic drag using real-time panel-method CFD and genetic algorithm optimization.

![3DAO Screenshot](https://via.placeholder.com/1200x600/1a1b26/60a5fa?text=3D+Aerodynamic+Optimizer)

## Features

### Core Capabilities

- **Fully Parametric 3D Shape Generation**: Define and manipulate geometries using intuitive parameter controls
- **Real-time Panel Method CFD**: GPU-accelerated WebGL-based solver for instant aerodynamic analysis
- **Genetic Algorithm Optimization**: Evolve shapes to meet performance goals while satisfying constraints
- **Interactive 3D Viewer**: Real-time visualization with pressure distribution overlay
- **STL Export**: Export optimized geometries for 3D printing or high-fidelity CFD validation

### 10 Predefined Scenarios

1. **High-Speed Bullet Train Nose** - Minimize drag at Mach 0.3
2. **F1 Rear Wing Endplate** - Maximize outwash within FIA regulations
3. **Low-Drag Bicycle Frame** - Minimize drag at 30 mph with 10° yaw
4. **Silent Drone Propeller** - Minimize aero-acoustic noise signature
5. **Venturi Effect Cooling Duct** - Maximize mass flow rate
6. **Endurance UAV Wing** - Maximize L/D ratio for long endurance
7. **Downforce-Generating Car Spoiler** - Maximize downforce with drag cap
8. **Wind Turbine Blade Section** - Maximize power coefficient
9. **Hydrofoil for Racing Yacht** - Minimize drag while avoiding cavitation
10. **Ahmed Body Optimization** - Minimize drag by optimizing rear geometry

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **3D Graphics**: Three.js + React Three Fiber
- **Styling**: Tailwind CSS 4 with OKLCH colors
- **UI Components**: shadcn/ui
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 22.x or higher
- pnpm package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/GhassanAlhamoud/3dao.git
cd 3dao

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
pnpm build
```

## Usage

1. **Select a Scenario**: Choose from 10 predefined optimization scenarios
2. **Adjust Parameters**: Use sliders to modify geometry parameters in real-time
3. **Run Optimization**: Click "Start" to begin genetic algorithm evolution
4. **Monitor Progress**: Watch fitness improve over generations
5. **Export Results**: Download optimized geometry as STL file

## Architecture

### Geometry Engine (`client/src/lib/geometry.ts`)

Parametric geometry generators for:
- NACA 4-digit airfoils
- Ogive (bullet) shapes
- Ahmed body (simplified car model)

### CFD Solver (`client/src/lib/cfd.ts`)

3D panel method implementation:
- Vortex lattice approximation
- Pressure coefficient calculation
- Drag and lift force computation

### Genetic Algorithm (`client/src/lib/genetic.ts`)

Optimization engine featuring:
- Tournament selection
- Blend crossover
- Gaussian mutation
- Constraint penalty system
- Elitism

## Project Structure

```
3dao/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   └── Viewer3D.tsx  # 3D visualization component
│   │   ├── lib/
│   │   │   ├── geometry.ts   # Parametric shape generators
│   │   │   ├── cfd.ts        # Panel method CFD solver
│   │   │   ├── genetic.ts    # Genetic algorithm engine
│   │   │   ├── scenarios.ts  # Predefined optimization scenarios
│   │   │   └── stl.ts        # STL export utilities
│   │   ├── pages/
│   │   │   └── Home.tsx      # Main application page
│   │   └── App.tsx
│   └── public/
└── README.md
```

## Scope

### In Scope

- Parametric 3D shape generation
- Real-time panel-method CFD in WebGL
- Genetic algorithm optimization
- Constraint enforcement (geometric & structural)
- Interactive 3D viewer

### Out of Scope

- Viscous/turbulence modeling (RANS/LES)
- Cloud compute or back-end services
- High-fidelity CFD (reserved for validation)

## Future Roadmap

See [3DAO_Specification.md](./3DAO_Specification.md) for the comprehensive feature roadmap including:

- Advanced geometry capabilities (topological mutations, morphing, meta-materials)
- Surrogate models and hybrid physics (differentiable CFD, neural operators)
- High-fidelity feedback (GPU-native RANS, adjoint methods)
- AI-driven insights (explainable AI, symbolic regression)
- Hardware integration (WebGPU, WASM optimization)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

Built with modern web technologies to democratize advanced aerodynamic design tools for engineers, designers, and researchers worldwide.

## Contact

For questions or feedback, please open an issue on GitHub.

---

**Note**: This is a client-side only application. All computations run in your browser using WebGL and WebAssembly for maximum performance.
