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
  swatchColor: string; // CSS color for UI
}

export const FINISHES: FinishPreset[] = [
  {
    id: 'chrome',
    name: 'Polished Chrome',
    color: new Color(0.88, 0.88, 0.9),
    metalness: 1.0,
    roughness: 0.02,
    envMapIntensity: 2.0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.03,
    swatchColor: '#d4d4d8',
  },
  {
    id: 'brushed-gold',
    name: 'Brushed Gold',
    color: new Color(0.83, 0.69, 0.22),
    metalness: 1.0,
    roughness: 0.25,
    envMapIntensity: 1.2,
    clearcoat: 0.1,
    clearcoatRoughness: 0.3,
    swatchColor: '#c9a035',
  },
  {
    id: 'matte-black',
    name: 'Matte Black',
    color: new Color(0.02, 0.02, 0.02),
    metalness: 0.95,
    roughness: 0.65,
    envMapIntensity: 0.4,
    clearcoat: 0.0,
    clearcoatRoughness: 0.5,
    swatchColor: '#1a1a1a',
  },
  {
    id: 'copper',
    name: 'Brushed Copper',
    color: new Color(0.72, 0.45, 0.2),
    metalness: 1.0,
    roughness: 0.2,
    envMapIntensity: 1.0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.15,
    swatchColor: '#b87333',
  },
  {
    id: 'brushed-nickel',
    name: 'Brushed Nickel',
    color: new Color(0.7, 0.7, 0.72),
    metalness: 1.0,
    roughness: 0.35,
    envMapIntensity: 0.9,
    clearcoat: 0.05,
    clearcoatRoughness: 0.4,
    swatchColor: '#9e9e9e',
  },
  {
    id: 'warm-bronze',
    name: 'Warm Bronze',
    color: new Color(0.55, 0.35, 0.15),
    metalness: 1.0,
    roughness: 0.3,
    envMapIntensity: 0.8,
    clearcoat: 0.15,
    clearcoatRoughness: 0.25,
    swatchColor: '#8B5E3C',
  },
];
