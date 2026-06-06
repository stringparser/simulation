export const SIMULATION_DEFAULTS = {
  temperature: 2.5,
  field: 0,
  coupling: 1,
} as const;

export const SLIDER_PARAMS = {
  temperature: {
    label: "Temperature",
    min: 0.5,
    max: 5,
    step: 0.1,
  },
  field: {
    label: "Field h",
    min: -2,
    max: 2,
    step: 0.1,
  },
  coupling: {
    label: "Coupling J",
    min: 0.1,
    max: 2,
    step: 0.1,
  },
} as const;
