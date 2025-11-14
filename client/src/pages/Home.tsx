import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, RotateCcw, Download, Save, Upload, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import Viewer3D from '@/components/Viewer3D';
import { scenarios } from '@/lib/scenarios';
import { GeneticAlgorithm, Gene } from '@/lib/genetic';
import { PanelMethodSolver } from '@/lib/cfd';
import { generateNACA4Airfoil, createWingGeometry, createOgiveGeometry, createAhmedBodyGeometry } from '@/lib/geometry';
import { exportToSTL, exportSession } from '@/lib/stl';
import * as THREE from 'three';
import { useTheme } from '@/contexts/ThemeContext';
import { APP_TITLE } from '@/const';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0].id);
  const [genes, setGenes] = useState<Gene[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [bestFitness, setBestFitness] = useState(0);
  const [avgFitness, setAvgFitness] = useState(0);
  const [fitnessHistory, setFitnessHistory] = useState<number[]>([]);
  const [currentGeometry, setCurrentGeometry] = useState<THREE.BufferGeometry | undefined>();
  const [pressureData, setPressureData] = useState<number[]>([]);
  const [dragCoeff, setDragCoeff] = useState(0);
  const [liftCoeff, setLiftCoeff] = useState(0);
  
  const ga = useMemo(() => new GeneticAlgorithm({
    populationSize: 30,
    mutationRate: 0.15,
    crossoverRate: 0.7,
    elitismCount: 2
  }), []);

  const scenario = scenarios.find(s => s.id === selectedScenario) || scenarios[0];

  // Initialize genes when scenario changes
  useEffect(() => {
    setGenes([...scenario.genes]);
    setGeneration(0);
    setBestFitness(0);
    setFitnessHistory([]);
    ga.initializePopulation(scenario.genes);
    updateGeometry(scenario.genes);
  }, [selectedScenario, scenario, ga]);

  // Generate geometry from genes
  const updateGeometry = (currentGenes: Gene[]) => {
    let geometry: THREE.BufferGeometry;

    if (scenario.baseGeometry === 'naca') {
      const camber = currentGenes.find(g => g.name === 'camber')?.value || 0;
      const camberPos = currentGenes.find(g => g.name === 'camberPos')?.value || 4;
      const thickness = currentGenes.find(g => g.name === 'thickness')?.value || 12;
      const chord = currentGenes.find(g => g.name === 'chord')?.value || 1.0;
      const span = currentGenes.find(g => g.name === 'span')?.value || 2.0;

      const airfoil = generateNACA4Airfoil(camber, camberPos, thickness);
      geometry = createWingGeometry(airfoil.x, airfoil.y, span, chord);
    } else if (scenario.baseGeometry === 'ogive') {
      const length = currentGenes.find(g => g.name === 'length')?.value || 5.0;
      const radius = currentGenes.find(g => g.name === 'radius')?.value || 1.0;
      geometry = createOgiveGeometry(length, radius);
    } else if (scenario.baseGeometry === 'ahmed') {
      const slantAngle = currentGenes.find(g => g.name === 'slantAngle')?.value || 25;
      geometry = createAhmedBodyGeometry(1.044, 0.389, 0.288, slantAngle);
    } else {
      // Default to simple wing
      const airfoil = generateNACA4Airfoil(0, 0, 12);
      geometry = createWingGeometry(airfoil.x, airfoil.y, 2.0, 1.0);
    }

    // Run CFD analysis
    const solver = new PanelMethodSolver(
      scenario.flowConditions.velocity,
      scenario.flowConditions.angleOfAttack,
      1.225,
      scenario.flowConditions.reynoldsNumber
    );

    const result = solver.solve(geometry);
    
    setCurrentGeometry(geometry);
    setPressureData(result.pressureCoefficients);
    
    // Calculate coefficients
    const refArea = 1.0; // Simplified reference area
    const cd = solver.calculateDragCoefficient(geometry, refArea);
    const cl = solver.calculateLiftCoefficient(geometry, refArea);
    setDragCoeff(cd);
    setLiftCoeff(cl);
  };

  // Optimization objective function
  const objectiveFunction = (geneValues: Gene[]) => {
    let geometry: THREE.BufferGeometry;

    if (scenario.baseGeometry === 'naca') {
      const camber = geneValues.find(g => g.name === 'camber')?.value || 0;
      const camberPos = geneValues.find(g => g.name === 'camberPos')?.value || 4;
      const thickness = geneValues.find(g => g.name === 'thickness')?.value || 12;
      const chord = geneValues.find(g => g.name === 'chord')?.value || 1.0;
      const span = geneValues.find(g => g.name === 'span')?.value || 2.0;

      const airfoil = generateNACA4Airfoil(camber, camberPos, thickness);
      geometry = createWingGeometry(airfoil.x, airfoil.y, span, chord);
    } else if (scenario.baseGeometry === 'ogive') {
      const length = geneValues.find(g => g.name === 'length')?.value || 5.0;
      const radius = geneValues.find(g => g.name === 'radius')?.value || 1.0;
      geometry = createOgiveGeometry(length, radius);
    } else if (scenario.baseGeometry === 'ahmed') {
      const slantAngle = geneValues.find(g => g.name === 'slantAngle')?.value || 25;
      geometry = createAhmedBodyGeometry(1.044, 0.389, 0.288, slantAngle);
    } else {
      const airfoil = generateNACA4Airfoil(0, 0, 12);
      geometry = createWingGeometry(airfoil.x, airfoil.y, 2.0, 1.0);
    }

    const solver = new PanelMethodSolver(
      scenario.flowConditions.velocity,
      scenario.flowConditions.angleOfAttack
    );

    const cd = solver.calculateDragCoefficient(geometry, 1.0);
    const cl = solver.calculateLiftCoefficient(geometry, 1.0);

    // Fitness based on optimization goal
    let fitness = 0;
    if (scenario.optimizationGoal.includes('Minimize drag')) {
      fitness = -cd; // Negative because we want to minimize
    } else if (scenario.optimizationGoal.includes('Maximize L/D')) {
      fitness = Math.abs(cd) > 0.001 ? cl / cd : 0;
    } else if (scenario.optimizationGoal.includes('Maximize downforce')) {
      fitness = -cl; // Negative lift is downforce
    } else {
      fitness = -cd; // Default to minimize drag
    }

    return { fitness, geometry, drag: cd, lift: cl };
  };

  // Run one generation of optimization
  const runGeneration = () => {
    ga.evolve(objectiveFunction);
    
    const best = ga.getBest();
    if (best) {
      setGeneration(ga.getGeneration());
      setBestFitness(best.fitness);
      setAvgFitness(ga.getAverageFitness());
      setFitnessHistory(ga.getFitnessHistory());
      
      if (best.geometry) {
        setCurrentGeometry(best.geometry);
        setGenes([...best.genes]);
        
        // Update CFD results
        const solver = new PanelMethodSolver(
          scenario.flowConditions.velocity,
          scenario.flowConditions.angleOfAttack
        );
        const result = solver.solve(best.geometry);
        setPressureData(result.pressureCoefficients);
        setDragCoeff(best.drag || 0);
        setLiftCoeff(best.lift || 0);
      }
    }
  };

  // Auto-run optimization
  useEffect(() => {
    if (!isOptimizing) return;
    
    const interval = setInterval(() => {
      runGeneration();
    }, 100);

    return () => clearInterval(interval);
  }, [isOptimizing]);

  const handleGeneChange = (index: number, value: number[]) => {
    const newGenes = [...genes];
    newGenes[index].value = value[0];
    setGenes(newGenes);
    updateGeometry(newGenes);
  };

  const handleReset = () => {
    setIsOptimizing(false);
    setGeneration(0);
    setBestFitness(0);
    setFitnessHistory([]);
    ga.initializePopulation(scenario.genes);
    setGenes([...scenario.genes]);
    updateGeometry(scenario.genes);
    toast.success('Optimization reset');
  };

  const handleExportSTL = () => {
    if (currentGeometry) {
      exportToSTL(currentGeometry, `${scenario.id}-optimized.stl`);
      toast.success('STL file exported');
    }
  };

  const handleExportSession = () => {
    exportSession({
      scenario: scenario.id,
      generation,
      bestFitness,
      genes,
      fitnessHistory
    });
    toast.success('Session exported');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{APP_TITLE}</h1>
            <p className="text-sm text-muted-foreground">Real-time aerodynamic shape optimization</p>
          </div>
          {toggleTheme && (
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Scenario Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Scenario</CardTitle>
                <CardDescription>Select optimization scenario</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{scenario.baseGeometry.toUpperCase()}</Badge>
                    <Badge variant="secondary">V={scenario.flowConditions.velocity} m/s</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parameters */}
            <Card>
              <CardHeader>
                <CardTitle>Parameters</CardTitle>
                <CardDescription>Adjust geometry parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {genes.map((gene, index) => (
                  <div key={gene.name} className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium capitalize">{gene.name}</label>
                      <span className="text-sm text-muted-foreground">{gene.value.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[gene.value]}
                      min={gene.min}
                      max={gene.max}
                      step={(gene.max - gene.min) / 100}
                      onValueChange={(value) => handleGeneChange(index, value)}
                      disabled={isOptimizing}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Optimization Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Optimization</CardTitle>
                <CardDescription>Control genetic algorithm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsOptimizing(!isOptimizing)}
                    className="flex-1"
                    variant={isOptimizing ? "destructive" : "default"}
                  >
                    {isOptimizing ? (
                      <><Pause className="mr-2 h-4 w-4" /> Pause</>
                    ) : (
                      <><Play className="mr-2 h-4 w-4" /> Start</>
                    )}
                  </Button>
                  <Button onClick={handleReset} variant="outline">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Generation:</span>
                    <span className="font-mono">{generation}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Best Fitness:</span>
                    <span className="font-mono">{bestFitness.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Fitness:</span>
                    <span className="font-mono">{avgFitness.toFixed(4)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export */}
            <Card>
              <CardHeader>
                <CardTitle>Export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleExportSTL} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Export STL
                </Button>
                <Button onClick={handleExportSession} variant="outline" className="w-full">
                  <Save className="mr-2 h-4 w-4" /> Save Session
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Viewer and Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3D Viewer */}
            <Card>
              <CardHeader>
                <CardTitle>3D Viewer</CardTitle>
                <CardDescription>Interactive geometry visualization with pressure distribution</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px]">
                  <Viewer3D geometry={currentGeometry} pressureData={pressureData} />
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Tabs defaultValue="performance">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle>Aerodynamic Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Drag Coefficient (Cd)</p>
                        <p className="text-3xl font-bold">{dragCoeff.toFixed(4)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Lift Coefficient (Cl)</p>
                        <p className="text-3xl font-bold">{liftCoeff.toFixed(4)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">L/D Ratio</p>
                        <p className="text-3xl font-bold">
                          {Math.abs(dragCoeff) > 0.001 ? (liftCoeff / dragCoeff).toFixed(2) : 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Reynolds Number</p>
                        <p className="text-xl font-mono">{scenario.flowConditions.reynoldsNumber.toExponential(1)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end gap-1">
                      {fitnessHistory.map((fitness, i) => {
                        const maxFitness = Math.max(...fitnessHistory, 0.1);
                        const minFitness = Math.min(...fitnessHistory, 0);
                        const range = maxFitness - minFitness;
                        const height = range > 0 ? ((fitness - minFitness) / range) * 100 : 0;
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-primary rounded-t"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`Gen ${i}: ${fitness.toFixed(4)}`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-sm text-muted-foreground text-center mt-4">
                      Fitness evolution over {fitnessHistory.length} generations
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
