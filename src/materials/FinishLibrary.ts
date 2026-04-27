import { Color } from 'three';

export interface FinishPreset {
  id: string;
  name: string;
  color: Color;
  metalness: number;
  roughness: number;
  envMapIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  anisotropy?: number;
  anisotropyRotation?: number;
  iridescence?: number;
  iridescenceIOR?: number;
  sheen?: number;
  sheenRoughness?: number;
  sheenColor?: Color;
  swatchColor: string;
}

export const FINISHES: FinishPreset[] = [
  {
    id: 'chrome',
    name: 'Polished Chrome',
    color: new Color(0.92, 0.92, 0.94),
    metalness: 1.0,
    roughness: 0.012,
    envMapIntensity: 3.5,
    clearcoat: 1.0,            // full lacquer layer — wet chrome look
    clearcoatRoughness: 0.015,
    iridescence: 0.15,         // subtle colour shift at glancing angles
    iridescenceIOR: 1.5,
    swatchColor: '#d4d4d8',
  },
  {
    id: 'brushed-gold',
    name: 'Brushed Gold',
    color: new Color(0.72, 0.56, 0.18),
    metalness: 0.92,
    roughness: 0.30,
    envMapIntensity: 1.6,
    clearcoat: 0.08,
    clearcoatRoughness: 0.30,
    swatchColor: '#c9a035',
  },
  {
    id: 'matte-black',
    name: 'Matte Black',
    color: new Color(0.016, 0.016, 0.016),
    metalness: 0.88,
    roughness: 0.70,
    envMapIntensity: 0.5,
    clearcoat: 0.0,
    clearcoatRoughness: 0.6,
    sheen: 0.3,                // micro-velvet sheen on dark matte surfaces
    sheenRoughness: 0.8,
    sheenColor: new Color(0.05, 0.05, 0.05),
    swatchColor: '#1a1a1a',
  },
  {
    id: 'copper',
    name: 'Brushed Copper',
    color: new Color(0.74, 0.36, 0.12),
    metalness: 0.92,
    roughness: 0.26,
    envMapIntensity: 1.6,
    clearcoat: 0.15,
    clearcoatRoughness: 0.18,
    swatchColor: '#b87333',
  },
  {
    id: 'brushed-nickel',
    name: 'Brushed Nickel',
    color: new Color(0.46, 0.45, 0.43),
    metalness: 0.90,
    roughness: 0.40,
    envMapIntensity: 1.3,
    clearcoat: 0.05,
    clearcoatRoughness: 0.42,
    swatchColor: '#9e9e9e',
  },
  {
    id: 'warm-bronze',
    name: 'Warm Bronze',
    color: new Color(0.50, 0.31, 0.11),
    metalness: 1.0,
    roughness: 0.26,
    envMapIntensity: 1.5,
    clearcoat: 0.18,
    clearcoatRoughness: 0.20,
    swatchColor: '#8B5E3C',
  },
];
