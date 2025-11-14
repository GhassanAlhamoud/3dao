import * as THREE from 'three';

export interface Gene {
  name: string;
  value: number;
  min: number;
  max: number;
}

export interface Individual {
  genes: Gene[];
  fitness: number;
  geometry?: THREE.BufferGeometry;
  drag?: number;
  lift?: number;
}

export interface Constraint {
  name: string;
  type: 'min' | 'max' | 'equal';
  value: number;
  evaluate: (individual: Individual) => number;
  penalty: number;
}

export interface GAConfig {
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  elitismCount: number;
  tournamentSize: number;
}

export class GeneticAlgorithm {
  private config: GAConfig;
  private population: Individual[] = [];
  private generation: number = 0;
  private bestIndividual: Individual | null = null;
  private fitnessHistory: number[] = [];
  private constraints: Constraint[] = [];

  constructor(config: Partial<GAConfig> = {}) {
    this.config = {
      populationSize: config.populationSize || 50,
      mutationRate: config.mutationRate || 0.1,
      crossoverRate: config.crossoverRate || 0.7,
      elitismCount: config.elitismCount || 2,
      tournamentSize: config.tournamentSize || 3
    };
  }

  /**
   * Initialize population with random individuals
   */
  initializePopulation(geneTemplate: Gene[]): void {
    this.population = [];
    for (let i = 0; i < this.config.populationSize; i++) {
      const genes: Gene[] = geneTemplate.map(gene => ({
        ...gene,
        value: gene.min + Math.random() * (gene.max - gene.min)
      }));
      this.population.push({
        genes,
        fitness: 0
      });
    }
    this.generation = 0;
    this.fitnessHistory = [];
  }

  /**
   * Add constraint to optimization
   */
  addConstraint(constraint: Constraint): void {
    this.constraints.push(constraint);
  }

  /**
   * Clear all constraints
   */
  clearConstraints(): void {
    this.constraints = [];
  }

  /**
   * Evaluate fitness for an individual
   */
  evaluateFitness(
    individual: Individual,
    objectiveFunction: (genes: Gene[]) => { fitness: number; geometry?: THREE.BufferGeometry; drag?: number; lift?: number }
  ): void {
    const result = objectiveFunction(individual.genes);
    let fitness = result.fitness;

    // Apply constraint penalties
    for (const constraint of this.constraints) {
      const value = constraint.evaluate(individual);
      let violation = 0;

      switch (constraint.type) {
        case 'min':
          violation = Math.max(0, constraint.value - value);
          break;
        case 'max':
          violation = Math.max(0, value - constraint.value);
          break;
        case 'equal':
          violation = Math.abs(value - constraint.value);
          break;
      }

      if (violation > 0) {
        fitness -= violation * constraint.penalty;
      }
    }

    individual.fitness = fitness;
    individual.geometry = result.geometry;
    individual.drag = result.drag;
    individual.lift = result.lift;
  }

  /**
   * Tournament selection
   */
  private tournamentSelection(): Individual {
    let best: Individual | null = null;
    for (let i = 0; i < this.config.tournamentSize; i++) {
      const candidate = this.population[Math.floor(Math.random() * this.population.length)];
      if (!best || candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    return best!;
  }

  /**
   * Crossover two individuals
   */
  private crossover(parent1: Individual, parent2: Individual): Individual {
    const genes: Gene[] = [];
    for (let i = 0; i < parent1.genes.length; i++) {
      const gene = { ...parent1.genes[i] };
      if (Math.random() < this.config.crossoverRate) {
        // Blend crossover
        const alpha = Math.random();
        gene.value = alpha * parent1.genes[i].value + (1 - alpha) * parent2.genes[i].value;
      }
      genes.push(gene);
    }
    return { genes, fitness: 0 };
  }

  /**
   * Mutate an individual
   */
  private mutate(individual: Individual): void {
    for (const gene of individual.genes) {
      if (Math.random() < this.config.mutationRate) {
        // Gaussian mutation
        const range = gene.max - gene.min;
        const mutation = (Math.random() - 0.5) * range * 0.2;
        gene.value = Math.max(gene.min, Math.min(gene.max, gene.value + mutation));
      }
    }
  }

  /**
   * Evolve to next generation
   */
  evolve(
    objectiveFunction: (genes: Gene[]) => { fitness: number; geometry?: THREE.BufferGeometry; drag?: number; lift?: number }
  ): void {
    // Evaluate fitness for all individuals
    for (const individual of this.population) {
      this.evaluateFitness(individual, objectiveFunction);
    }

    // Sort by fitness
    this.population.sort((a, b) => b.fitness - a.fitness);

    // Track best individual
    if (!this.bestIndividual || this.population[0].fitness > this.bestIndividual.fitness) {
      this.bestIndividual = { ...this.population[0], genes: [...this.population[0].genes] };
    }

    // Track fitness history
    this.fitnessHistory.push(this.population[0].fitness);

    // Create next generation
    const nextGeneration: Individual[] = [];

    // Elitism: keep best individuals
    for (let i = 0; i < this.config.elitismCount; i++) {
      nextGeneration.push({
        genes: [...this.population[i].genes],
        fitness: this.population[i].fitness
      });
    }

    // Generate offspring
    while (nextGeneration.length < this.config.populationSize) {
      const parent1 = this.tournamentSelection();
      const parent2 = this.tournamentSelection();
      const offspring = this.crossover(parent1, parent2);
      this.mutate(offspring);
      nextGeneration.push(offspring);
    }

    this.population = nextGeneration;
    this.generation++;
  }

  /**
   * Get current generation number
   */
  getGeneration(): number {
    return this.generation;
  }

  /**
   * Get best individual
   */
  getBest(): Individual | null {
    return this.bestIndividual;
  }

  /**
   * Get current population
   */
  getPopulation(): Individual[] {
    return this.population;
  }

  /**
   * Get fitness history
   */
  getFitnessHistory(): number[] {
    return this.fitnessHistory;
  }

  /**
   * Get average fitness of current population
   */
  getAverageFitness(): number {
    if (this.population.length === 0) return 0;
    const sum = this.population.reduce((acc, ind) => acc + ind.fitness, 0);
    return sum / this.population.length;
  }
}
